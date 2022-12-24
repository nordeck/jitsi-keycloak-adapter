# Jitsi-Keycloak Adapter

Allow `Jitsi` to use `Keycloak` as an identity and `OIDC` provider.

- [1. Features](#1-features)
- [2. Setup](#2-setup)
  - [2.1 Token authentication](#21-token-authentication)
  - [2.2 Deno](#22-deno)
  - [2.3 Adapter](#23-adapter)
  - [2.4 Nginx](#24-nginx)
- [3. Guest users](#3-guest-users)
- [4. Similar projects](#4-similar-projects)
- [5. Sponsors](#5-sponsors)

## 1. Features

- SSO support for `Jitsi`
- Allows `guest` user if needed
- Not based on `the external JWT` which will be deprecated in the near future.
- Not based on `tokenAuthUrl`

Check [flows](./docs/flows.txt) if you are interested in how it works.

## 2. Setup

### 2.1 Token authentication

Enable the token authentication for `prosody`.

```bash
apt-get install jitsi-meet-tokens
```

### 2.2 Deno

Install `deno`

```bash
apt-get install unzip

cd /tmp
wget -T 30 -O deno.zip https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip
unzip deno.zip
cp /tmp/deno /usr/local/bin/

deno --version
```

### 2.3 Adapter

Clone the repo.

```bash
git clone ssh://git@github.com:22/nordeck/jitsi-keycloak-adapter.git
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
adduser adapter --system --group --disabled-password --gecos ''

mkdir -p /home/adapter/app
cp config.ts /home/adapter/app/
cp adapter.sh /home/adapter/app/
cp adapter.ts /home/adapter/app/
chown adapter: /home/adapter/app -R

cp templates/etc/systemd/system/oidc-adapter.service /etc/systemd/system/
```

Update the settings according to your environment. Edit
[/home/adapter/app/config.ts](./config.ts)

Start the service

```bash
systemctl daemon-reload
systemctl enable oidc-adapter.service
systemctl start oidc-adapter.service
systemctl status oidc-adapter.service
```

### 2.4 Nginx

Customize the `nginx` configuration. You may check
[/etc/jitsi/sites-available/example.conf](.//templates/etc/nginx/sites-available/example.conf)

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

## 3. Guest users

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

Comment `token_verification` in your `/etc/prosody/conf.d/YOUR-DOMAIN.cfg.lua`

```lua
--"token_verification";
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
hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.authentication.authentication-lifetime "10 seconds"
hocon -f /etc/jitsi/jicofo/jicofo.conf set jicofo.conference.enable-auto-owner false

systemctl restart jicofo.service
```

Set `anonymousdomain` in `config.js`

```bash
echo "config.hosts.anonymousdomain = 'guest.domain.loc';" >> /etc/jitsi/meet/*-config.js
```

## 4. Similar projects

- [jitsi-keycloak](https://github.com/D3473R/jitsi-keycloak)
- [Jitsi-SAML2JWT](https://github.com/Renater/Jitsi-SAML2JWT)

## 5. Sponsors

[![Nordeck](docs/images/nordeck.png)](https://nordeck.net/)
