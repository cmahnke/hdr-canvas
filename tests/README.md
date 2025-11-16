# Test notes

## Generating test images

This constrcts a simple test image that looks uniform in SDR:

```
magick \( -size 100x100 xc:"rgb(80,0,0)" -depth 8 -set colorspace RGB \)   \( -size 100x100 xc:red -evaluate Multiply 5 \) +append  gainmap.png
magick -define uhdr:hdr-color-transfer=hlg -define uhdr:sdr-color-gamut=bt709 -define uhdr:hdr-color-gamut=bt2100 -define uhdr:gainmap-quality=70 -define uhdr:output-color-transfer=srgb   \( -size 200x100 xc:red -depth 8 -set colorspace RGB \)  \( gainmap.png -depth 16 \) uhdr:ultrahdr.jpg
```
