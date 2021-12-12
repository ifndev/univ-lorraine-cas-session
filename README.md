# univ-lorraine-cas-session

## Usage

```js
// Import
import ULSession from "univ-lorraine-cas-session";

// Create a new ULSession
let ulSession = new ULSession();

// Log in
ulSession.login("username", "password")
    .then(
        () => {
            // We are now logged in
            console.log("logged in sucessfuly");
            
            // Fetch a page using the newly authenticated session
            ulSession.fetchPage("https://assiduite.univ-lorraine.fr/etudiant/absences")
                .then(
                    (page) => {
                        // Page fetched sucessfully, print out the content
                        console.log(page);
                    }
                )
                .catch(
                    (error) => {
                        // An error occured while fetching the page
                        console.log(error);
                    }
                )
        }
    )
    .catch(function (error) {
        // An error occured while logging in
        console.log(error);
    }
    );
```