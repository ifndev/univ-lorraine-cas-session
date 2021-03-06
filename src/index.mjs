import { fetch, CookieJar } from "node-fetch-cookies";

export default class Session {

    #sessionCookies = new CookieJar();
    #baseHeaders = {
        "User-Agent": `univ-lorraine-cas-session/1.1.2 (github.com/ifndev/univ-lorraine-cas-session)`,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        "Content-Type": "application/x-www-form-urlencoded",
        "mode": "cors"
    }

    /**
     * Asynchronously gets the "execution" tag value from the login page
     * this value is mandatory for login as you have to pass it to the body of the request
     * @returns {Promise<string>}
     */
    async getExecution() {
        let response = await fetch(this.#sessionCookies, "https://auth.univ-lorraine.fr/login", {
            "headers": this.#baseHeaders,
            "method": "GET"
        }).catch(err => {
            throw (`Error while fetching /login: \n${err}`);
        });

        let text = await response.text();

        const execution = text.match(/<input type="hidden" name="execution" value="(.*?)"/)[1];

        return execution;
    }

    /**
     * Asynchronously logs in to the CAS using the given credentials.
     * @param {String} username 
     * @param {String} password 
     */
    async login(username, password) {
        let execution = await this.getExecution();

        let response = await fetch(this.#sessionCookies, "https://auth.univ-lorraine.fr/login", {
            "credentials": "include",
            "headers": this.#baseHeaders,
            "method": "POST",
            "body": `username=${username}&password=${password}&execution=${execution}&_eventId=submit&submit=Connexion`
        }).catch(err => {
            throw (`Error while logging in: \n${err}`);
        });

        if (response.status === 200) {
            if (response.headers.get("Set-Cookie").includes("TGC-CAS")) {
                return;
            }
            else {
                throw ("Login error (unknown)");
            }
        } else {
            throw ("Login error (bad credentials)");
        }
    }

    /**
     * Logs out of the CAS
     * @returns 
     */
    async logout() {
        await this.fetchPage("https://auth.univ-lorraine.fr/logout").catch(err => {
            throw (`Error while logging out: \n${err}\n cookies will be cleared anyway`);
        }).finally(() => {
            this.#sessionCookies = new CookieJar();
        });
    }



    /**
     * Asynchronously fetches a page using the authenticated session
     * @param url url of the request
     * @param options options (headers, method, body)
     * @returns 
     */
    async fetchPage(url, options) {

        if (this.#sessionCookies?.cookies?.get("auth.univ-lorraine.fr")?.get("TGC-CAS") != null) {
            options = {
                "headers": options?.headers != null ? { ...this.#baseHeaders, ...options.headers } : this.#baseHeaders,
                "method": options?.method != null ? options.method.toUpperCase() : "GET",
            }

            if (options.body != null) {

                if (options.method != "head" || options.method != "get") {
                    options["body"] = options.body;
                }
                else {
                    throw ("Cannot send a body with a GET or HEAD request");
                }
            }

            let response = await fetch(this.#sessionCookies, url, options).catch(err => {
                throw (`Error while fetching ${url}: \n${err}`);
            });

            if (response.status === 440) {
                throw ("Session expired: please try logging-in again");
            }
            else {
                return response.text();
            }

        } else {
            throw ("You must be logged in to the CAS before fetching a page \n Use login(username, password) to login");
        }
    }

    get cookies() {
        return this.#sessionCookies;
    }
}