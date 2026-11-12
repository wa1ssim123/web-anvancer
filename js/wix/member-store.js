// Declarations of member-store.ts: what this file exports, their arguments and what they return.
// import { type LoginOptions, type LoginResult } from "./auth.js";
// import type { CurrentMember } from "./members-types.js";
// export interface MemberState {
//     member: CurrentMember | null;
//     loggedIn: boolean;
//     loading: boolean;
//     error: string | null;
// }
// export declare function getMemberState(): MemberState;
// export declare function hydrateMember(member: CurrentMember | null): void;
// export declare function subscribeMember(fn: (state: MemberState) => void): () => void;
// export declare function refreshMember(): Promise<void>;
// export declare function login(email: string, password: string, options?: LoginOptions): Promise<LoginResult>;
// export declare function register(email: string, password: string, profile?: {
//     firstName?: string;
//     lastName?: string;
// }, options?: LoginOptions): Promise<LoginResult>;
// export declare function verifyEmail(code: string): Promise<LoginResult>;
// export declare function logout(returnTo?: string): Promise<void>;
// Member session state — a module-scope store, deliberately NOT a React context.
// A context can't span Astro islands (each island is its own React root); a module
// singleton is shared by every island in the page bundle, and works identically in a
// single-root SPA. Consume it through useMember() (hooks/), or subscribe directly.
import { fetchCurrentMember } from "./members.js";
import { loggedInHint, loginMember, logoutMember, registerMember, verifyMemberEmail, } from "./auth.js";
const EMPTY = {
    member: null,
    loggedIn: false,
    loading: true,
    error: null,
};
let state = EMPTY;
const listeners = new Set();
let started = false;
function setState(patch) {
    state = { ...state, ...patch };
    for (const l of listeners)
        l();
}
export function getMemberState() {
    return state;
}
/** Adopt an SSR-resolved member (Astro island props) so no client re-fetch happens. */
export function hydrateMember(member) {
    if (started)
        return;
    started = true;
    state = { member, loggedIn: member !== null, loading: false, error: null };
}
export function subscribeMember(fn) {
    const listener = () => { try {
        fn(getMemberState());
    }
    catch (e) {
        console.error("member-store listener failed", e);
    } };
    listeners.add(listener);
    // First subscriber triggers the initial session read (browser only — SSR renders `loading`).
    if (!started && typeof window !== "undefined") {
        started = true;
        // Defer the first refresh until subscribeMember has returned its
        // unsubscribe callback. Without this, a logged-out visitor can receive
        // a synchronous notification while callers still initialize `unsub`.
        void Promise.resolve().then(refreshMember);
    }
    return () => listeners.delete(listener);
}
/** Re-read the session — call after anything that may have changed it. */
export async function refreshMember() {
    setState({ loading: true, error: null });
    // A persisted token is only a hint, never proof of an authenticated identity.
    // A stale member token must NOT send visitors back to the account page.
    const hint = loggedInHint();
    if (!hint) {
        setState({ member: null, loggedIn: false, loading: false });
        return;
    }
    try {
        const member = await fetchCurrentMember();
        const verified = Boolean(member?.id);
        setState({ member: verified ? member : null, loggedIn: verified, loading: false,
            error: verified ? null : "Votre session doit être renouvelée." });
    }
    catch (e) {
        setState({ member: null, loggedIn: false, loading: false,
            error: "Vérification de session indisponible. Réessayez." });
    }
}
async function runLogin(action) {
    try {
        const result = await action();
        // Managed Astro: the session is written by the callback the browser is about to visit; navigate
        // and do nothing else here (the page unloads). Manual: the tokens are already in place — re-read.
        if (result.state === "SUCCESS" && result.redirectUrl) {
            window.location.assign(result.redirectUrl);
            return result;
        }
        if (result.state === "SUCCESS")
            await refreshMember();
        if (result.state === "FAILURE")
            setState({
                error: result.error ?? result.errorCode ?? "Could not log in.",
            });
        return result;
    }
    catch (e) {
        setState({ error: e instanceof Error ? e.message : String(e) });
        throw e;
    }
}
/**
 * Submit the branded in-app sign-in form. `returnTo` is where a SUCCESS lands (managed Astro: the
 * callback's destination; the caller navigates itself otherwise).
 */
export function login(email, password, options) {
    return runLogin(() => loginMember(email, password, options));
}
/** Submit the branded in-app sign-up form (names only where PROFILE_ON_SIGNUP is true). */
export function register(email, password, profile, options) {
    return runLogin(() => registerMember(email, password, profile, options));
}
/** Finish an email-verification branch from the same in-app form. */
export function verifyEmail(code) {
    return runLogin(() => verifyMemberEmail(code));
}
/** Log out (navigates away); local state resets for the instant before the redirect lands. */
export async function logout(returnTo) {
    setState({ member: null, loggedIn: false });
    try {
        await logoutMember(returnTo);
    }
    catch (e) {
        setState({ error: e instanceof Error ? e.message : String(e) });
        throw e;
    }
}
