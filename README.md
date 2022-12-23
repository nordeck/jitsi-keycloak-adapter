# Jitsi-Keycloak Adapter

Allow `Jitsi` to use `Keycloak` as an identity and `OIDC` provider.

## Features

- SSO support for `Jitsi`
- Allows `guest` user if needed
- Not based on `the external JWT` which will be deprecated in the near future.
- Not based on `tokenAuthUrl`

Check [flows](./docs/flows.txt) if you are interested in how it works.

## Setup

### Token authentication

Enable the token authentication for `prosody`.

```bash
apt-get install jitsi-meet-tokens
```

### Deno

Install `deno`

```bash
apt-get install unzip

cd /tmp
wget -T 30 -O deno.zip https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip
unzip deno.zip
cp /tmp/deno /usr/local/bin/

deno --version
```

### Adapter

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

Setup adapter service.

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

### Nginx

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

## Guest users

If you want to allow guest users to join the meeting after it's created by a
moderator then add the guest domain for `prosody`

_/etc/prosody/conf.avail/guest.cfg.lua_

```lua
VirtualHost "guest.domain.loc"
    authentication = "anonymous"
    c2s_require_encryption = false
```

```bash
ln -s ../conf.avail/guest.cfg.lua /etc/prosody/conf.d/
```

## Similar projects

- [jitsi-keycloak](https://github.com/D3473R/jitsi-keycloak)
- [Jitsi-SAML2JWT](https://github.com/Renater/Jitsi-SAML2JWT)

## Sponsors

[![Nordeck](docs/images/nordeck.png)](https://nordeck.net/)
