# Standalone setup

The setup guide to install `Jitsi Keycloak Adapter` on a standalone Jitsi
server.

Tested on `Debian 11 Bullseye`. Use `root` account while running the commands.

- [1. Token authentication](#1-token-authentication)
- [2. Deno](#2-deno)
- [3. Keycloak adapter](#3-keycloak-adapter)
- [4. Nginx](#4-nginx)
- [5. Guest users](#5-guest-users)

## 1. Token authentication

Enable the token authentication for `prosody`.

```bash
apt-get install jitsi-meet-tokens
```

Check related parameters in your `/etc/prosody/conf.d/YOUR-DOMAIN.cfg.lua`. They
should be already set by `apt-get` command.

```lua
VirtualHost "<YOUR-DOMAIN>"
    authentication = "token";
    app_id="<YOUR_APP_ID>"
    app_secret="<YOUR_APP_SECRET>"
```

Test the JWT authentication with a valid token. You may generate the token on
[Jitok](https://jitok.emrah.com/). The meeting link should be like the
following:

```bash
https://jitsi.mydomain.tld/myroom?jwt=<PASTE_TOKEN_HERE>
```

## 2. Deno

Install `deno`

```bash
apt-get install unzip

cd /tmp
wget -T 30 -O deno.zip https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip
unzip -o deno.zip
cp /tmp/deno /usr/local/bin/

deno --version
```

## 3. Keycloak adapter

Clone the repo.

```bash
apt-get install git

git clone https://github.com/nordeck/jitsi-keycloak-adapter.git
```

Copy the static files.

```bash
cd jitsi-keycloak-adapter
cp /usr/share/jitsi-meet/{body.html,body.html.$(date +'%H%M%S').bck}
cp templates/usr/share/jitsi-meet/body.html /usr/share/jitsi-meet/
cp templates/usr/share/jitsi-meet/static/oidc-* /usr/share/jitsi-meet/static/
```

Setup the adapter service.

```bash
adduser adapter --system --group --disabled-password --shell /bin/bash \
  --home /home/adapter

mkdir -p /home/adapter/app
cp config.ts /home/adapter/app/
cp adapter.sh /home/adapter/app/
cp adapter.ts /home/adapter/app/
chown adapter: /home/adapter/app -R

cp templates/etc/systemd/system/oidc-adapter.service /etc/systemd/system/
```

Update the settings according to your environment. Edit
[/home/adapter/app/config.ts](../config.ts)

Disable the `testing` line and enable the `prod` line in
[/home/adapter/app/adapter.sh](../adapter.sh) if `keycloak` has a trusted
certificate. It should be for the production environment.

```bash
# testing: allow self-signed certificate for Keycloak
#deno run --allow-net --unsafely-ignore-certificate-errors $BASEDIR/adapter.ts

# prod
deno run --allow-net $BASEDIR/adapter.ts
```

Start the service

```bash
systemctl daemon-reload
systemctl enable oidc-adapter.service
systemctl start oidc-adapter.service
systemctl status oidc-adapter.service
```

## 4. Nginx

Customize the `nginx` configuration. You may check
[/etc/jitsi/sites-available/example.conf](../templates/etc/nginx/sites-available/example.conf)

Add the following lines as the first `location` blocks

```conf
    # /oidc/redirect
    location = /oidc/redirect {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }

    # /oidc/tokenize
    location = /oidc/tokenize {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }

    # /oidc/auth
    location = /oidc/auth {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }
```

Change the `location @root_path` block as below

```conf
    # oidc: customized @root_path
    location @root_path {
        if ($arg_oidc) {
            rewrite ^/(.*)$ / break;
        }
        if ($arg_jwt) {
            rewrite ^/(.*)$ / break;
        }

        rewrite ^/(.*)$ /static/oidc-redirect.html;
    }
```

Restart the `nginx` service

```bash
systemctl restart nginx
```

## 5. Guest users

If you want to allow guest users to join the meeting after it's created by a
moderator then add the guest domain for `prosody`

Create _/etc/prosody/conf.avail/guest.cfg.lua_ file with the following contents.

```lua
VirtualHost "guest.domain.loc"
    authentication = "anonymous"
    c2s_require_encryption = false
```

Create a symbolic link for this config file.

```bash
ln -s ../conf.avail/guest.cfg.lua /etc/prosody/conf.d/
```

Set `allow_empty_token` in your `/etc/prosody/conf.d/YOUR-DOMAIN.cfg.lua`.

```lua
VirtualHost "<YOUR-DOMAIN>"
    authentication = "token";
    app_id="<YOUR_APP_ID>"
    app_secret="<YOUR_APP_SECRET>"
    allow_empty_token=true
```

Restart the `prosody` service

```bash
systemctl restart prosody.service
```

Enable `external XMPP authentication` for `jicofo`

```bash
DOMAIN=$(hocon -f /etc/jitsi/jicofo/jicofo.conf get jicofo.xmpp.client.xmpp-domain)

hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.authentication.enabled true
hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.authentication.type XMPP
hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.authentication.login-url $DOMAIN
hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.authentication.enable-auto-login false
hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.conference.enable-auto-owner false

systemctl restart jicofo.service
```

Set `anonymousdomain` in `config.js`

```bash
echo "config.hosts.anonymousdomain = 'guest.domain.loc';" >> /etc/jitsi/meet/*-config.js
```
