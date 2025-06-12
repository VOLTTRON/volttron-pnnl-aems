if [ ! -f /etc/certs/mkcert-ca.crt ]; then
    mkcert create-ca \
    --key "/etc/certs/mkcert-ca.key" \
    --cert "/etc/certs/mkcert-ca.crt"
fi;
if [ ! -f /etc/certs/mkcert-hostname.crt ]; then
    mkcert create-cert \
    --ca-key "/etc/certs/mkcert-ca.key" \
    --ca-cert "/etc/certs/mkcert-ca.crt" \
    --key "/etc/certs/mkcert-hostname.key" \
    --cert "/etc/certs/mkcert-hostname.crt" \
    --domain "${HOSTNAME}"
fi;