```
                                                      FLOW FOR AUTHENTICATED USER
                                                      ===========================


browser               nginx            redirect.html         adapter.html       nordeck adapter         keycloak               jitsi
───┬───               ──┬──            ──────┬──────         ─────┬──────       ───────┬───────         ────┬───               ──┬──
   │                    │                    │                    │                    │                    │                    │
   │                    │                    │                                         │                    │                    │
   │    join request    │      internal      │            auth check request           │        start       │                    │
   │(no-token + no-flag)│      redirect      │    (with captured data from browser)    │   auth check flow  │                    │
   ├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶│                    │
   │                    │                    │                                         │                    │                    │
   │                                           redirect to adapter                                          │                    │
   │                                 (with a short-term authorization code)                                 │                    │
   │◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤                    │
   │                                                                                                        │                    │
   │                      redirected request                           token request                        │                    │
   │                          (with code)                         │     (with code)    │     check code     │                    │
   ├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶│                    │
   │                                                              │                    │                    │                    │
   │                      redirect to meeting                     │                    │                    │                    │
   │                         (with token)                         │        token       │       code ok      │                    │
   │◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤                    │
   │                                                              │                    │                    │                    │
   │ redirected request                                                                                                          │
   │       (token)      │                                           internal redirect                                            │
   ├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶│
   │                    │                                                                                                        │
   │                                                                                                                             │
   │                                                           allowed                                                           │
   │◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤





                                                     FLOW FOR UNAUTHENTICATED USER
                                                     =============================


browser               nginx            redirect.html         adapter.html       nordeck adapter         keycloak               jitsi
───┬───               ──┬──              ────┬───              ───┬───              ───┬───             ────┬───               ──┬──
   │                    │                    │                    │                    │                    │                    │
   │                    │                    │                                         │                    │                    │
   │    join request    │      internal      │            auth check request           │        start       │                    │
   │(no-token + no-flag)│      redirect      │    (with captured data from browser)    │   auth check flow  │                    │
   ├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶│                    │
   │                    │                    │                                         │                    │                    │
   │                                           redirect to adapter                                          │                    │
   │                                   (with error, no authorization code)                                  │                    │
   │◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤                    │
   │                                                                                                        │                    │
   │                      redirected request                                           │                    │                    │
   │                        (without code)                        │                    │                    │                    │
   ├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶│                    │                    │                    │
   │                                                              │                    │                    │                    │
   │                      redirect to meeting                     │                    │                    │                    │
   │                     (with flag, no-token)                    │                    │                    │                    │
   │◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤                    │                    │                    │
   │                                                              │                    │                    │                    │
   │ redirected request                                                                                                          │
   │  (flag, no-token)  │                                           internal redirect                                            │
   ├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶├╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶▶│
   │                    │                                                                                                        │
   │                                                         not allowed                                                         │
   │                                                    (wait for host screen)                                                   │
   │◀╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┤
```

# vim: tw=140
