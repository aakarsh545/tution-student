from PIL import Image, ImageDraw, ImageFont
import os

sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

def create_icon(size, is_round=False):
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    bg_color = '#6366F1'
    
    if is_round:
        draw.ellipse((0, 0, size, size), fill=bg_color)
    else:
        draw.rounded_rectangle((0, 0, size, size), radius=size//8, fill=bg_color)
        
    try:
        font_size = int(size * 0.6)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
        
    text = "S"
    
    # Calculate text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    
    draw.text(((size-w)/2, (size-h)/2 - size*0.05), text, font=font, fill='white')
    return img

def main():
    base_path = 'android/app/src/main/res'
    if not os.path.exists(base_path):
        print("Android project not found")
        return
        
    for dpi, size in sizes.items():
        dir_path = os.path.join(base_path, f'mipmap-{dpi}')
        os.makedirs(dir_path, exist_ok=True)
        
        # ic_launcher
        img = create_icon(size, False)
        img.save(os.path.join(dir_path, 'ic_launcher.png'))
        
        # ic_launcher_round
        img_round = create_icon(size, True)
        img_round.save(os.path.join(dir_path, 'ic_launcher_round.png'))
    print("Icons generated successfully!")

if __name__ == "__main__":
    main()
