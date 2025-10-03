# Professional SSL Certificate Generation Script for AquaFarm Pro
# This script creates self-signed SSL certificates using .NET cryptography

param(
    [string]$Domain = "localhost",
    [string]$CertPath = ".\infra\nginx\ssl",
    [int]$ValidDays = 365
)

Write-Host "🔐 Generating SSL certificates for AquaFarm Pro..." -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Cyan
Write-Host "Certificate Path: $CertPath" -ForegroundColor Cyan
Write-Host "Valid for: $ValidDays days" -ForegroundColor Cyan

# Create certificate directory if it doesn't exist
if (!(Test-Path $CertPath)) {
    New-Item -ItemType Directory -Path $CertPath -Force | Out-Null
    Write-Host "✅ Created certificate directory: $CertPath" -ForegroundColor Green
}

try {
    # Load required .NET assemblies
    Add-Type -AssemblyName System.Security
    
    # Create certificate request
    $certRequest = New-Object System.Security.Cryptography.X509Certificates.CertificateRequest
    $certRequest.Subject = "CN=$Domain"
    
    # Add Subject Alternative Names (SAN)
    $sanBuilder = New-Object System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder
    $sanBuilder.AddDnsName($Domain)
    $sanBuilder.AddDnsName("localhost")
    $sanBuilder.AddDnsName("127.0.0.1")
    $sanBuilder.AddDnsName("*.localhost")
    $sanBuilder.AddIpAddress([System.Net.IPAddress]::Parse("127.0.0.1"))
    $sanBuilder.AddIpAddress([System.Net.IPAddress]::Parse("::1"))
    
    $certRequest.CertificateExtensions.Add($sanBuilder.Build())
    
    # Add Key Usage extension
    $keyUsage = New-Object System.Security.Cryptography.X509Certificates.X509KeyUsageExtension(
        [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature -bor
        [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment,
        $false
    )
    $certRequest.CertificateExtensions.Add($keyUsage)
    
    # Add Enhanced Key Usage extension
    $enhancedKeyUsage = New-Object System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension(
        @(
            [System.Security.Cryptography.Oid]"1.3.6.1.5.5.7.3.1",  # Server Authentication
            [System.Security.Cryptography.Oid]"1.3.6.1.5.5.7.3.2"   # Client Authentication
        ),
        $false
    )
    $certRequest.CertificateExtensions.Add($enhancedKeyUsage)
    
    # Generate RSA key pair
    $rsa = [System.Security.Cryptography.RSA]::Create(2048)
    $certRequest.PublicKey = $rsa.PublicKey
    
    # Create self-signed certificate
    $notBefore = [DateTime]::UtcNow.AddDays(-1)
    $notAfter = $notBefore.AddDays($ValidDays)
    
    $cert = $certRequest.CreateSelfSigned($notBefore, $notAfter)
    
    # Export certificate to PEM format
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $certPem += [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem += "`n-----END CERTIFICATE-----"
    
    # Export private key to PEM format
    $privateKeyPem = "-----BEGIN PRIVATE KEY-----`n"
    $privateKeyPem += [System.Convert]::ToBase64String($rsa.ExportPkcs8PrivateKey(), [System.Base64FormattingOptions]::InsertLineBreaks)
    $privateKeyPem += "`n-----END PRIVATE KEY-----"
    
    # Save certificate file
    $certFile = Join-Path $CertPath "self-signed.crt"
    $certPem | Out-File -FilePath $certFile -Encoding ASCII
    Write-Host "✅ Certificate saved: $certFile" -ForegroundColor Green
    
    # Save private key file
    $keyFile = Join-Path $CertPath "self-signed.key"
    $privateKeyPem | Out-File -FilePath $keyFile -Encoding ASCII
    Write-Host "✅ Private key saved: $keyFile" -ForegroundColor Green
    
    # Set proper file permissions (Windows)
    $acl = Get-Acl $keyFile
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
        "FullControl",
        "Allow"
    )
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path $keyFile -AclObject $acl
    
    Write-Host "✅ File permissions set for private key" -ForegroundColor Green
    
    # Display certificate information
    Write-Host "`n📋 Certificate Information:" -ForegroundColor Yellow
    Write-Host "Subject: $($cert.Subject)" -ForegroundColor White
    Write-Host "Issuer: $($cert.Issuer)" -ForegroundColor White
    Write-Host "Valid From: $($cert.NotBefore)" -ForegroundColor White
    Write-Host "Valid Until: $($cert.NotAfter)" -ForegroundColor White
    Write-Host "Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
    
    # Verify certificate files
    if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
        Write-Host "`n🎉 SSL certificates generated successfully!" -ForegroundColor Green
        Write-Host "Certificate: $certFile" -ForegroundColor Cyan
        Write-Host "Private Key: $keyFile" -ForegroundColor Cyan
        Write-Host "`nYou can now start your Docker containers with SSL support." -ForegroundColor Yellow
    } else {
        throw "Certificate files were not created successfully"
    }
    
} catch {
    Write-Host "❌ Error generating SSL certificates: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Docker containers: docker compose up -d" -ForegroundColor White
Write-Host "2. Access application: https://localhost" -ForegroundColor White
Write-Host "3. Accept self-signed certificate in browser" -ForegroundColor White
