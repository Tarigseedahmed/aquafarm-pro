# Generate self-signed SSL certificates for AquaFarm Pro
$certPath = "infra/nginx/ssl"
$certName = "self-signed"

# Create certificate
$cert = New-SelfSignedCertificate -DnsName "localhost", "aquafarm.cloud", "api.aquafarm.cloud" -CertStoreLocation "cert:\LocalMachine\My" -KeyAlgorithm RSA -KeyLength 2048 -Provider "Microsoft RSA SChannel Cryptographic Provider" -KeyExportPolicy Exportable -KeyUsage DigitalSignature,KeyEncipherment -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Export certificate
$certPath = Join-Path $certPath "$certName.crt"
Export-Certificate -Cert $cert -FilePath $certPath -Type CERT

# Export private key
$keyPath = Join-Path (Split-Path $certPath) "$certName.key"
$keyBytes = $cert.PrivateKey.ExportRSAPrivateKey()
[System.IO.File]::WriteAllBytes($keyPath, $keyBytes)

Write-Host "SSL certificates generated successfully:"
Write-Host "Certificate: $certPath"
Write-Host "Private Key: $keyPath"
