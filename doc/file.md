# File

> prefix: `/file`

## post `/upload`

Content-Type: multipart/form-data

req:

```sh
curl 'http://localhost:3000/file/upload' \
    -H 'Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryVuSkafv2P53NsDZB' \
    --data-raw $'------WebKitFormBoundaryVuSkafv2P53NsDZB\r\nContent-Disposition: form-data; name="file"; filename="qr-code.png"\r\nContent-Type: image/png\r\n\r\n\r\n------WebKitFormBoundaryVuSkafv2P53NsDZB--\r\n'

```

## get `/list`

res

```json
{ "data": [".", "7262f7574b348cb21528d7e01.png"], "error": null, "message": "OK", "status": 200, "duration": 9 }
```
