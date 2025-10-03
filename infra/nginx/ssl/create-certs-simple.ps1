# Simple SSL Certificate Generation for AquaFarm Pro
param(
    [string]$Domain = "localhost"
)

Write-Host "🔐 Creating SSL certificates for AquaFarm Pro..." -ForegroundColor Green

# Create certificate directory
$certDir = ".\infra\nginx\ssl"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

try {
    # Use PowerShell's built-in certificate creation
    $cert = New-SelfSignedCertificate -Subject "CN=$Domain" -DnsName @($Domain, "localhost", "127.0.0.1") -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddDays(365)
    
    # Export certificate to PEM format
    $certPath = "$certDir\self-signed.crt"
    $keyPath = "$certDir\self-signed.key"
    
    # Export certificate
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem += "`n-----END CERTIFICATE-----"
    $certPem | Out-File -FilePath $certPath -Encoding ASCII
    
    # Export private key
    $keyBytes = $cert.PrivateKey.ExportPkcs8PrivateKey()
    $keyPem = "-----BEGIN PRIVATE KEY-----`n"
    $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
    $keyPem += "`n-----END PRIVATE KEY-----"
    $keyPem | Out-File -FilePath $keyPath -Encoding ASCII
    
    Write-Host "✅ SSL certificates created successfully!" -ForegroundColor Green
    Write-Host "Certificate: $certPath" -ForegroundColor Cyan
    Write-Host "Private Key: $keyPath" -ForegroundColor Cyan
    
    # Clean up certificate from store
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
