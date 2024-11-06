# tokenAuthUrl

This is a parameter in `config.js` which allows to redirect the unauthenticated
participant to the authentication service. The authentication service should
redirect the participant back to the meeting with a token.

The related comments in the current Jitsi release (`2.0.9779`):

```javascript
// You can use external service for authentication that will redirect back passing a jwt token
// You can use tokenAuthUrl config to point to a URL of such service.
// The URL for the service supports few params which will be filled in by the code.
// tokenAuthUrl:
//      'https://myservice.com/auth/{room}?code_challenge_method=S256&code_challenge={code_challenge}&state={state}'
// Supported parameters in tokenAuthUrl:
//      {room} - will be replaced with the room name
//      {code_challenge} - (A web only). A oauth 2.0 code challenge that will be sent to the service. See:
//          https://datatracker.ietf.org/doc/html/rfc7636. The code verifier will be saved in the sessionStorage
//          under key: 'code_verifier'.
//      {state} - A json with the current state before redirecting. Keys that are included in the state:
//          - room (The current room name as shown in the address bar)
//          - roomSafe (the backend safe room name to use (lowercase), that is passed to the backend)
//          - tenant (The tenant if any)
//          - config.xxx (all config overrides)
//          - interfaceConfig.xxx (all interfaceConfig overrides)
//          - ios=true (in case ios mobile app is used)
//          - android=true (in case android mobile app is used)
//          - electron=true (when web is loaded in electron app)
// If there is a logout service you can specify its URL with:
// tokenLogoutUrl: 'https://myservice.com/logout'
// You can enable tokenAuthUrlAutoRedirect which will detect that you have logged in successfully before
// and will automatically redirect to the token service to get the token for the meeting.
// tokenAuthUrlAutoRedirect: false
```

## Usage

If this value is set like the following in `config.js`:

```javascript
config.tokenAuthUrl = "https://jitsi.yourdomain.com/static/token.html";
```

The participant will be redirected to

```
https://jitsi.yourdomain.com/static/token.html
```

when she visits

```
https://jitsi.yourdomain.com/mytenant/myRoom
```