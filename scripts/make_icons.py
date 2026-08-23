# PWA 아이콘 생성 스크립트 (PIL 사용)
# 웜 파스텔(피치/코랄) 그라데이션 배경 + 흰색 버스 아이콘
# - Android(PWA): icon-192/512 (투명 여백 없는 마스커블 형태)
# - iOS(apple-touch-icon): 180x180, 투명도 없는 풀블리드 사각형
#   (iOS가 자동으로 라운드 코너를 적용하므로 배경을 끝까지 채움)
from PIL import Image, ImageDraw

PEACH_TOP = (255, 214, 191)   # #ffd6bf (소프트 피치)
CORAL_BOTTOM = (253, 186, 176) # #fdbab0 (소프트 코랄)
WHITE = (255, 255, 255)
ROSE = (225, 105, 105)        # #e16969 (창문용 로즈)


def gradient_bg(size: int) -> Image.Image:
    """상단 피치 → 하단 코랄 수직 그라데이션 (투명도 없음)"""
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(PEACH_TOP[0] + (CORAL_BOTTOM[0] - PEACH_TOP[0]) * t)
        g = int(PEACH_TOP[1] + (CORAL_BOTTOM[1] - PEACH_TOP[1]) * t)
        b = int(PEACH_TOP[2] + (CORAL_BOTTOM[2] - PEACH_TOP[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def make_icon(size: int, path: str):
    img = gradient_bg(size).convert('RGBA')
    d = ImageDraw.Draw(img)

    s = size / 512

    # 버스 몸체 (흰색)
    bx0, by0 = 96 * s, 128 * s
    bx1, by1 = 416 * s, 384 * s
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=40 * s, fill=WHITE)

    # 창문 (로즈 핑크)
    wy0, wy1 = by0 + 40 * s, by0 + 140 * s
    d.rounded_rectangle([bx0 + 32 * s, wy0, bx0 + 132 * s, wy1], radius=12 * s, fill=ROSE)
    d.rounded_rectangle([bx0 + 152 * s, wy0, bx1 - 152 * s, wy1], radius=12 * s, fill=ROSE)
    d.rounded_rectangle([bx1 - 132 * s, wy0, bx1 - 32 * s, wy1], radius=12 * s, fill=ROSE)

    # 바퀴 (연한 크림 원)
    r = 36 * s
    wheel = (255, 237, 213, 255)  # #ffedd5
    for cx in (bx0 + 80 * s, bx1 - 80 * s):
        cy = by1 - 8 * s
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=wheel)

    img.save(path)
    print(f'saved {path}')


make_icon(192, 'public/icon-192.png')
make_icon(512, 'public/icon-512.png')
make_icon(180, 'public/apple-touch-icon.png')  # iOS: 풀블리드 사각형 (라운드는 iOS가 적용)

# favicon.svg는 별도 파일로 관리