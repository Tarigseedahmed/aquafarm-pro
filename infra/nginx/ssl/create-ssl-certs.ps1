# Professional SSL Certificate Generation for AquaFarm Pro
param(
    [string]$Domain = "localhost",
    [string]$OutputPath = "infra/nginx/ssl"
)

# Create output directory
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
}

# Generate certificate with proper configuration
$cert = New-SelfSignedCertificate `
    -DnsName $Domain, "aquafarm.cloud", "api.aquafarm.cloud" `
    -CertStoreLocation "cert:\CurrentUser\My" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature,KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") `
    -FriendlyName "AquaFarm Pro SSL Certificate"

# Export certificate
$certPath = Join-Path $OutputPath "self-signed.crt"
Export-Certificate -Cert $cert -FilePath $certPath -Type CERT

# Export private key using OpenSSL format
$keyPath = Join-Path $OutputPath "self-signed.key"
$password = ConvertTo-SecureString -String "aquafarm2025" -Force -AsPlainText
$pfxPath = Join-Path $OutputPath "self-signed.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password

Write-Host "SSL certificates created successfully:"
Write-Host "Certificate: $certPath"
Write-Host "Private Key: $keyPath"
Write-Host "PFX: $pfxPath"

