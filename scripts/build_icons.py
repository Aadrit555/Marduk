import os
from PIL import Image
import numpy as np

def build_all_icons():
    master_path = 'assets/branding/marduk-icon-master.jpg'
    if not os.path.exists(master_path):
        raise FileNotFoundError(f"Master icon not found at {master_path}")

    img = Image.open(master_path)
    arr = np.array(img)

    # 1. Cleanly crop outer 2-pixel black border
    cropped = arr[2:519, 2:523].copy()
    h, w, _ = cropped.shape

    # 2. Repair tiny screenshot badge in bottom-right (Y 500:h, X 498:w) with adjacent grass texture
    badge_y1, badge_y2 = 500, h
    badge_x1, badge_x2 = 498, w
    bw = badge_x2 - badge_x1
    source_patch = cropped[badge_y1:badge_y2, (badge_x1 - bw):badge_x1]
    cropped[badge_y1:badge_y2, badge_x1:badge_x2] = source_patch

    base_img = Image.fromarray(cropped)
    # Master 512x512
    img_512 = base_img.resize((512, 512), Image.Resampling.LANCZOS)

    # Save to assets/branding/
    os.makedirs('assets/branding', exist_ok=True)
    img_512.save('assets/branding/marduk-icon-512.png')

    # Tauri icons target
    tauri_icons_dir = 'src-tauri/icons'
    os.makedirs(tauri_icons_dir, exist_ok=True)

    # 1. Standard Tauri sizes
    img_512.save(os.path.join(tauri_icons_dir, 'icon.png'))
    img_512.resize((256, 256), Image.Resampling.LANCZOS).save(os.path.join(tauri_icons_dir, '128x128@2x.png'))
    img_512.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(tauri_icons_dir, '128x128.png'))
    img_512.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(tauri_icons_dir, '32x32.png'))

    # 2. Windows Store / UWP squares
    square_sizes = {
        'Square30x30Logo.png': (30, 30),
        'Square44x44Logo.png': (44, 44),
        'Square71x71Logo.png': (71, 71),
        'Square89x89Logo.png': (89, 89),
        'Square107x107Logo.png': (107, 107),
        'Square142x142Logo.png': (142, 142),
        'Square150x150Logo.png': (150, 150),
        'Square284x284Logo.png': (284, 284),
        'Square310x310Logo.png': (310, 310),
        'StoreLogo.png': (50, 50),
    }
    for filename, size in square_sizes.items():
        img_512.resize(size, Image.Resampling.LANCZOS).save(os.path.join(tauri_icons_dir, filename))

    # 3. Windows ICO multi-resolution file
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_path = os.path.join(tauri_icons_dir, 'icon.ico')
    img_512.save(ico_path, format='ICO', sizes=ico_sizes)

    # 4. macOS ICNS
    icns_path = os.path.join(tauri_icons_dir, 'icon.icns')
    img_512.save(icns_path, format='ICNS')

    # Frontend public icons target
    frontend_public = 'frontend/public'
    os.makedirs(frontend_public, exist_ok=True)

    img_512.save(os.path.join(frontend_public, 'icon.png'))
    img_512.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(frontend_public, 'apple-touch-icon.png'))
    img_512.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(frontend_public, 'favicon-32x32.png'))
    img_512.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(frontend_public, 'favicon-16x16.png'))
    img_512.save(os.path.join(frontend_public, 'favicon.ico'), format='ICO', sizes=ico_sizes)

    print("Successfully built all official MARDUK brand icons across src-tauri/icons and frontend/public!")

if __name__ == '__main__':
    build_all_icons()
