import struct
import zlib
import os

def write_png(path, width, height, pixels):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            r, g, b, a = pixels[y][x]
            raw += bytes([r, g, b, a])

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))


def make_color_icon(size, path):
    bg = (91, 76, 240, 255)     # brand purple-blue
    fg = (255, 255, 255, 255)   # white glyph
    px = [[bg for _ in range(size)] for _ in range(size)]

    s = size / 32.0
    def set_px(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            px[y][x] = color

    def thick_line(x0, y0, x1, y1, color, thickness):
        steps = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(steps + 1):
            t = i / steps
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t
            for dx in range(-thickness, thickness + 1):
                for dy in range(-thickness, thickness + 1):
                    set_px(int(x + dx), int(y + dy), color)

    th = max(1, int(round(1.6 * s)))
    # "<" bracket
    thick_line(13 * s, 8 * s, 7 * s, 16 * s, fg, th)
    thick_line(7 * s, 16 * s, 13 * s, 24 * s, fg, th)
    # ">" bracket
    thick_line(19 * s, 8 * s, 25 * s, 16 * s, fg, th)
    thick_line(25 * s, 16 * s, 19 * s, 24 * s, fg, th)
    # "/" slash between
    thick_line(17.5 * s, 7 * s, 14.5 * s, 25 * s, fg, max(1, int(round(1.3 * s))))

    write_png(path, size, size, px)


def make_outline_icon(size, path):
    transparent = (255, 255, 255, 0)
    fg = (255, 255, 255, 255)
    px = [[transparent for _ in range(size)] for _ in range(size)]

    s = size / 32.0
    def set_px(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            px[y][x] = color

    def thick_line(x0, y0, x1, y1, color, thickness):
        steps = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(steps + 1):
            t = i / steps
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t
            for dx in range(-thickness, thickness + 1):
                for dy in range(-thickness, thickness + 1):
                    set_px(int(x + dx), int(y + dy), color)

    th = max(1, int(round(1.4 * s)))
    thick_line(13 * s, 8 * s, 7 * s, 16 * s, fg, th)
    thick_line(7 * s, 16 * s, 13 * s, 24 * s, fg, th)
    thick_line(19 * s, 8 * s, 25 * s, 16 * s, fg, th)
    thick_line(25 * s, 16 * s, 19 * s, 24 * s, fg, th)
    thick_line(17.5 * s, 7 * s, 14.5 * s, 25 * s, fg, max(1, int(round(1.1 * s))))

    write_png(path, size, size, px)


out_dir = os.path.join(os.path.dirname(__file__), "..", "manifest")
os.makedirs(out_dir, exist_ok=True)
make_color_icon(192, os.path.join(out_dir, "color.png"))
make_outline_icon(32, os.path.join(out_dir, "outline.png"))
print("icons written to", os.path.abspath(out_dir))
