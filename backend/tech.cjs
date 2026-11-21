'use strict';
/* HORENOVA TECH pilot API.
   Auth: validated Wix member session; venue isolation by Wix member ID.
   Storage: Neon/PostgreSQL, transactional sales and immutable stock ledger.
   Deliberately NO payment collection, fiscal certification or remote equipment control. */
const crypto=require('node:crypto');

function createTechHandler({pool,json,read,rate,auth,requireRole,error,limit,uuid}) {
  const str=(x,n=120)=>limit(x,n);
  const int=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
  function ensurePositiveMoney(c){if(!int(c,0,100000000))throw error(422,'Prix invalide (centimes).');return c;}
  function ensureStock(q){if(!int(q,0,10000000))throw error(422,'Quantité de stock invalide.');return q;}
  const pickVenue=row=>({id:row.id,name:row.name,city:row.city,slug:row.slug,status:row.status,createdAt:row.created_at});
  const pickProduct=row=>({id:row.id,sku:row.sku,name:row.name,category:row.category,priceCentimes:row.price_centimes,stock:row.stock_qty,active:row.active,menuVisible:row.menu_visible});
  async function venueAccess(venueId,user){
    if(!uuid(venueId))throw error(400,'Établissement invalide.');
    const q=await pool.query('SELECT * FROM ht_venues WHERE id=$1',[venueId]);
    const venue=q.rows[0];
    if(!venue || (user.role!=='admin'&&venue.owner_wix_id!==user.id))
      throw error(404,'Établissement introuvable.');
    return venue;
  }
  async function listVenueProducts(venueId,all=true){
    const q=await pool.query(
      'SELECT id,sku,name,category,price_centimes,stock_qty,active,menu_visible FROM ht_products WHERE venue_id=$1'+(all?'':' AND active=true AND menu_visible=true')+' ORDER BY category,name LIMIT 500',
      [venueId]);
    return q.rows.map(pickProduct);
  }
  async function createSale(req,res,venueId,user){
    rate(user.id+':tech-sale',60,60);
    const d=await read(req,16000);
    const reference=str(d.reference,90);
    const table=str(d.table,24)||'COMPTOIR';
    if(!/^[a-z0-9_-]{8,90}$/i.test(reference))throw error(422,'Référence de vente invalide.');
    if(!Array.isArray(d.items)||d.items.length<1||d.items.length>80)throw error(422,'Ajoutez de 1 à 80 articles.');
    const merged=new Map();
    for(const item of d.items){
      const id=String(item.productId||'');
      if(!uuid(id)||!int(item.quantity,1,1000))throw error(422,'Produit ou quantité invalide.');
      merged.set(id,(merged.get(id)||0)+item.quantity);
    }
    if([...merged.values()].some(n=>n>10000))throw error(422,'Quantité excessive.');
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const existing=await client.query('SELECT id,total_centimes FROM ht_sales WHERE venue_id=$1 AND client_reference=$2',[venueId,reference]);
      if(existing.rows.length){
        await client.query('COMMIT');
        return json(res,200,{ok:true,duplicate:true,id:existing.rows[0].id,totalCentimes:Number(existing.rows[0].total_centimes)});
      }
      const ids=[...merged.keys()].sort();
      const q=await client.query(
        'SELECT id,name,price_centimes,stock_qty,active FROM ht_products WHERE venue_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE',
        [venueId,ids]);
      if(q.rows.length!==ids.length)throw error(422,'Un article n’appartient pas à cet établissement.');
      let total=0;
      const lines=[];
      for(const p of q.rows){
        const quantity=merged.get(p.id);
        if(!p.active)throw error(409,'Un article est désactivé : '+p.name);
        if(p.stock_qty<quantity)throw error(409,'Stock insuffisant : '+p.name);
        const lineTotal=p.price_centimes*quantity;
        total+=lineTotal;
        if(!Number.isSafeInteger(total)||total>9000000000000)throw error(422,'Montant de vente excessif.');
        lines.push({p,quantity,lineTotal});
      }
      const sale=await client.query(
        'INSERT INTO ht_sales(venue_id,actor_wix_id,table_label,client_reference,total_centimes) VALUES($1,$2,$3,$4,$5) RETURNING id,created_at',
        [venueId,user.id,table,reference,total]);
      const saleId=sale.rows[0].id;
      for(const line of lines){
        const p=line.p;
        await client.query('UPDATE ht_products SET stock_qty=stock_qty-$1,updated_at=now() WHERE id=$2 AND venue_id=$3',
          [line.quantity,p.id,venueId]);
        await client.query('INSERT INTO ht_sale_lines(sale_id,product_id,product_name,quantity,unit_price_centimes,line_total_centimes) VALUES($1,$2,$3,$4,$5,$6)',
          [saleId,p.id,p.name,line.quantity,p.price_centimes,line.lineTotal]);
        await client.query('INSERT INTO ht_stock_movements(venue_id,product_id,sale_id,actor_wix_id,delta,reason) VALUES($1,$2,$3,$4,$5,$6)',
          [venueId,p.id,saleId,user.id,-line.quantity,'VENTE']);
      }
      await client.query('COMMIT');
      return json(res,201,{ok:true,id:saleId,totalCentimes:total,createdAt:sale.rows[0].created_at});
    } catch(e) {
      await client.query('ROLLBACK').catch(()=>{});
      if(e.code==='23505'){
        const q=await pool.query('SELECT id,total_centimes FROM ht_sales WHERE venue_id=$1 AND client_reference=$2',[venueId,reference]);
        if(q.rows.length)return json(res,200,{ok:true,duplicate:true,id:q.rows[0].id,totalCentimes:Number(q.rows[0].total_centimes)});
      }
      throw e;
    } finally {client.release();}
  }
  async function handle(req,res,path,method){
    if(!path.startsWith('/api/tech/'))return false;

    // Public read-only digital menu. No private venue fields, customer details or inventory exposed.
    const publicMenu=path.match(/^\/api\/tech\/menu\/([a-z0-9-]{3,70})$/);
    if(publicMenu&&method==='GET'){
      rate('tech-menu-'+(req.socket.remoteAddress||'unknown'),120,60);
      const q=await pool.query("SELECT id,name,city FROM ht_venues WHERE slug=$1 AND status IN ('PILOT','ACTIVE')",[publicMenu[1]]);
      if(!q.rows.length)throw error(404,'Menu indisponible.');
      const venue=q.rows[0];
      const products=await listVenueProducts(venue.id,false);
      return json(res,200,{venue:{name:venue.name,city:venue.city},items:products.map(({id,name,category,priceCentimes})=>({id,name,category,priceCentimes}))},{'Cache-Control':'public, max-age=30'});
    }
    if(method==='OPTIONS')return json(res,204,{});
    const user=await auth(req);
    requireRole(user,['admin','recruiter']);
    rate(user.id+':tech',120,60);

    if(path==='/api/tech/venues'){
      if(method==='GET'){
        const q=user.role==='admin'?
          await pool.query('SELECT id,name,city,slug,status,created_at FROM ht_venues ORDER BY created_at DESC LIMIT 200'):
          await pool.query('SELECT id,name,city,slug,status,created_at FROM ht_venues WHERE owner_wix_id=$1 ORDER BY created_at DESC LIMIT 60',[user.id]);
        return json(res,200,{venues:q.rows.map(pickVenue)});
      }
      if(method==='POST'){
        const d=await read(req,6000);
        const name=str(d.name,120),city=str(d.city,90);
        if(name.length<2)throw error(422,'Nom d’établissement trop court.');
        const norm=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,43)||'restaurant';
        const slug=norm+'-'+crypto.randomBytes(5).toString('hex');
        const result=await pool.query(
          'INSERT INTO ht_venues(owner_wix_id,name,city,slug) VALUES($1,$2,$3,$4) RETURNING id,name,city,slug,status,created_at',
          [user.id,name,city,slug]);
        return json(res,201,{ok:true,venue:pickVenue(result.rows[0])});
      }
    }
    const m=path.match(/^\/api\/tech\/venues\/([0-9a-f-]{36})(?:\/(products|stock|sales|movements))?(?:\/([0-9a-f-]{36}))?$/i);
    if(m){
      const venueId=m[1],action=m[2]||'',productId=m[3];
      const venue=await venueAccess(venueId,user);
      if(!action&&method==='GET'){
        const q=await pool.query(
          'SELECT (SELECT count(*)::int FROM ht_sales WHERE venue_id=$1) AS sales_count,(SELECT COALESCE(sum(total_centimes),0)::bigint FROM ht_sales WHERE venue_id=$1) AS revenue_centimes,(SELECT count(*)::int FROM ht_products WHERE venue_id=$1 AND stock_qty<=5 AND active=true) AS stock_alerts',
          [venueId]);
        const summary=q.rows[0];
        return json(res,200,{venue:pickVenue(venue),products:await listVenueProducts(venueId),summary:{salesCount:summary.sales_count,revenueCentimes:Number(summary.revenue_centimes),stockAlerts:summary.stock_alerts}});
      }
      if(action==='products' && !productId && method==='GET')return json(res,200,{products:await listVenueProducts(venueId)});
      if(action==='products' && !productId && method==='POST'){
        rate(user.id+':tech-products',35,60);
        const d=await read(req,9000);
        const name=str(d.name,140),category=str(d.category,80)||'Autres',sku=str(d.sku,60)||null;
        const price=ensurePositiveMoney(d.priceCentimes);
        const stock=ensureStock(d.stock);
        if(name.length<2)throw error(422,'Nom d’article trop court.');
        try {
          const q=await pool.query(
            'INSERT INTO ht_products(venue_id,sku,name,category,price_centimes,stock_qty,menu_visible) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [venueId,sku,name,category,price,stock,d.menuVisible!==false]);
          if(stock>0)await pool.query('INSERT INTO ht_stock_movements(venue_id,product_id,actor_wix_id,delta,reason) VALUES($1,$2,$3,$4,$5)',
            [venueId,q.rows[0].id,user.id,stock,'STOCK INITIAL']);
          return json(res,201,{ok:true,product:pickProduct(q.rows[0])});
        }catch(e){if(e.code==='23505')throw error(409,'Cette référence SKU existe déjà.');throw e;}
      }
      if(action==='products' && productId && method==='PATCH'){
        if(!uuid(productId))throw error(400,'Produit invalide.');
        const d=await read(req,8000);
        const set=[],vals=[];
        const add=(column,value)=>{vals.push(value);set.push(column+'=$'+vals.length);};
        if(d.name!==undefined){const name=str(d.name,140);if(name.length<2)throw error(422,'Nom invalide.');add('name',name);}
        if(d.category!==undefined)add('category',str(d.category,80)||'Autres');
        if(d.priceCentimes!==undefined)add('price_centimes',ensurePositiveMoney(d.priceCentimes));
        if(d.menuVisible!==undefined){if(typeof d.menuVisible!=='boolean')throw error(422,'Visibilité invalide.');add('menu_visible',d.menuVisible);}
        if(d.active!==undefined){if(typeof d.active!=='boolean')throw error(422,'Statut invalide.');add('active',d.active);}
        if(!set.length)throw error(422,'Aucune modification autorisée.');
        const q=await pool.query('UPDATE ht_products SET '+set.join(',')+',updated_at=now() WHERE venue_id=$'+(vals.length+1)+' AND id=$'+(vals.length+2)+' RETURNING *',
          [...vals,venueId,productId]);
        if(!q.rows.length)throw error(404,'Article introuvable.');
        return json(res,200,{ok:true,product:pickProduct(q.rows[0])});
      }
      if(action==='stock'&&method==='POST'){
        rate(user.id+':tech-stock',65,60);
        const d=await read(req,5000);
        if(!uuid(String(d.productId||''))||!int(d.delta,-100000,100000)||d.delta===0)
          throw error(422,'Mouvement de stock invalide.');
        const reason=str(d.reason,200);
        if(reason.length<3)throw error(422,'Motif obligatoire pour tracer le stock.');
        const client=await pool.connect();
        try {
          await client.query('BEGIN');
          const q=await client.query(
            'UPDATE ht_products SET stock_qty=stock_qty+$1,updated_at=now() WHERE venue_id=$2 AND id=$3 AND stock_qty+$1 BETWEEN 0 AND 10000000 RETURNING *',
            [d.delta,venueId,d.productId]);
          if(!q.rows.length)throw error(409,'Article absent ou stock négatif / excessif.');
          await client.query('INSERT INTO ht_stock_movements(venue_id,product_id,actor_wix_id,delta,reason) VALUES($1,$2,$3,$4,$5)',
            [venueId,d.productId,user.id,d.delta,reason]);
          await client.query('COMMIT');
          return json(res,200,{ok:true,product:pickProduct(q.rows[0])});
        }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
      }
      if(action==='sales'&&method==='POST')return createSale(req,res,venueId,user);
      if(action==='sales'&&method==='GET'){
        const q=await pool.query(
          'SELECT id,table_label,total_centimes,created_at FROM ht_sales WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100',
          [venueId]);
        return json(res,200,{sales:q.rows.map(s=>({id:s.id,table:s.table_label,totalCentimes:Number(s.total_centimes),createdAt:s.created_at}))});
      }
      if(action==='movements'&&method==='GET'){
        const q=await pool.query(
          'SELECT m.id,m.delta,m.reason,m.created_at,p.name AS product_name FROM ht_stock_movements m JOIN ht_products p ON p.id=m.product_id WHERE m.venue_id=$1 ORDER BY m.created_at DESC LIMIT 100',[venueId]);
        return json(res,200,{movements:q.rows.map(m=>({id:m.id,delta:m.delta,reason:m.reason,createdAt:m.created_at,productName:m.product_name}))});
      }
    }
    throw error(404,'Route HORENOVA TECH introuvable.');
  }
  return handle;
}
module.exports={createTechHandler};