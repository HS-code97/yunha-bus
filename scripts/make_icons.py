# PWA 아이콘 생성 스크립트 (PIL 사용)
# 파란 배경 + 흰색 버스 모양 아이콘
from PIL import Image, ImageDraw

BLUE = (37, 99, 235)      # #2563eb
WHITE = (255, 255, 255)

def make_icon(size: int, path: str):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 둥근 사각형 배경
    radius = size // 5
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BLUE)

    s = size / 512  # 스케일 기준

    # 버스 몸체
    bx0, by0 = 96 * s, 128 * s
    bx1, by1 = 416 * s, 384 * s
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=40 * s, fill=WHITE)

    # 창문 (파란색)
    wy0, wy1 = by0 + 40 * s, by0 + 140 * s
    d.rectangle([bx0 + 32 * s, wy0, bx0 + 132 * s, wy1], fill=BLUE)
    d.rectangle([bx0 + 152 * s, wy0, bx1 - 152 * s, wy1], fill=BLUE)
    d.rectangle([bx1 - 132 * s, wy0, bx1 - 32 * s, wy1], fill=BLUE)

    # 바퀴 (배경색 원)
    r = 36 * s
    for cx in (bx0 + 80 * s, bx1 - 80 * s):
        cy = by1 - 8 * s
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(248, 250, 252, 255))

    img.save(path)
    print(f'saved {path}')

make_icon(192, 'public/icon-192.png')
make_icon(512, 'public/icon-512.png')
make_icon(180, 'public/apple-touch-icon.png')

# favicon.svg는 별도 파일로 관리