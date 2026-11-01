"""
Automated verification of MARDUK direct application downloads.
Verifies HTTP headers, stream disposition, content length, binary checksum, and executable headers.
"""

import sys
import hashlib
import urllib.request
import struct

RELEASE_DOWNLOAD_URL = "https://github.com/Aadrit555/Marduk/releases/latest/download/MARDUK-Setup-x64.exe"
EXPECTED_SHA256 = "1f570b12efcdcd5e35fa28dc94c6d5109e6b3da37a596141bb0c2b4404404089"
EXPECTED_BYTES = 11635200
EXPECTED_FILENAME = "MARDUK-Setup-x64.exe"

def verify_live_asset():
    print(f"[1/4] Probing direct asset download URL:\n      {RELEASE_DOWNLOAD_URL}")
    req = urllib.request.Request(
        RELEASE_DOWNLOAD_URL,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        final_url = resp.geturl()
        status = resp.status
        content_type = resp.headers.get("Content-Type", "")
        content_disposition = resp.headers.get("Content-Disposition", "")
        content_length = int(resp.headers.get("Content-Length", 0))

        print(f"      Resolved Status: {status}")
        print(f"      Content-Type: {content_type}")
        print(f"      Content-Disposition: {content_disposition}")
        print(f"      Content-Length: {content_length} bytes ({content_length / (1024*1024):.2f} MB)")

        assert status == 200, f"Expected status 200, got {status}"
        assert "application/octet-stream" in content_type.lower() or "application/x-msdownload" in content_type.lower(), f"Unexpected Content-Type: {content_type}"
        assert "attachment" in content_disposition.lower(), f"Expected attachment disposition, got: {content_disposition}"
        assert EXPECTED_FILENAME.lower() in content_disposition.lower(), f"Filename not found in Content-Disposition: {content_disposition}"
        assert content_length == EXPECTED_BYTES, f"Size mismatch: expected {EXPECTED_BYTES}, got {content_length}"

        print("[2/4] Streaming binary payload to verify integrity...")
        payload = resp.read()
        assert len(payload) == EXPECTED_BYTES, f"Downloaded length mismatch: {len(payload)}"

        # Verify PE Executable header
        assert payload[:2] == b"MZ", "Binary does not start with DOS 'MZ' signature"
        e_lfanew = struct.unpack_from("<I", payload, 0x3C)[0]
        pe_sig = payload[e_lfanew:e_lfanew+4]
        assert pe_sig == b"PE\x00\x00", f"Invalid PE signature: {pe_sig}"
        print("      Verified Windows PE x64 Executable Header ('MZ' and 'PE\\0\\0')")

        actual_sha = hashlib.sha256(payload).hexdigest()
        print(f"      Computed SHA-256: {actual_sha}")
        assert actual_sha == EXPECTED_SHA256, f"SHA256 mismatch!\nExpected: {EXPECTED_SHA256}\nActual:   {actual_sha}"
        print("      Checksum validation: SUCCESS")

def verify_local_public_bundle():
    print("[3/4] Verifying local public fallback installer...")
    local_path = "frontend/public/downloads/MARDUK-Setup-x64.exe"
    with open(local_path, "rb") as f:
        data = f.read()
    assert len(data) == EXPECTED_BYTES
    local_sha = hashlib.sha256(data).hexdigest()
    assert local_sha == EXPECTED_SHA256
    print(f"      Local asset verified ({len(data)} bytes, sha256 matches)")

def verify_frontend_dist():
    print("[4/4] Verifying production frontend bundle...")
    with open("frontend/dist/index.html", "r", encoding="utf-8") as f:
        html = f.read()
    assert 'href="/favicon.ico"' in html, "favicon.ico missing from index.html"
    assert 'href="/icon.png"' in html, "icon.png missing from index.html"
    assert 'MARDUK' in html, "Page title missing MARDUK"
    print("      Production HTML icons and titles: SUCCESS")

if __name__ == "__main__":
    try:
        verify_live_asset()
        verify_local_public_bundle()
        verify_frontend_dist()
        print("\n=======================================================")
        print("ALL DOWNLOAD REQUIREMENTS FULLY VERIFIED AND PASSING!")
        print("=======================================================")
    except Exception as e:
        print(f"\nVerification FAILED: {e}", file=sys.stderr)
        sys.exit(1)
