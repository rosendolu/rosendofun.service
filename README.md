# rosendofun.service ![Last Commit](https://badgen.net/github/last-commit/rosendolu/rosendofun.service?label=🟣%20Updated&labelColor=black&color=448AFF)

> Request rate limit `10r/s` **_Exceeded `ip` will be banned_**
>
> BaseURL: https://api.rosendo.fun

[![Star History Chart](https://api.star-history.com/svg?repos=rosendolu/rosendofun.service&type=Timeline)](https://github.com/rosendolu/rosendofun.service#readme)

## Development

1. Config env

Create env file `touch .env.local`

```yaml
SECRET_KEYS=xxxxxx
```

2. Create secret key

```sh
mkdir local
openssl genpkey -algorithm RSA -out local/private_key.pem
openssl rsa -pubout -in local/private_key.pem -out local/public_key.pem
```

3. Deploy

```sh
npm run deploy
```

## [HTTP](doc/http.md)

## [File](doc/file.md)
