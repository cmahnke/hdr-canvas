# Test notes

## Generating test images

This constrcts a simple test image that looks uniform in SDR:

```
magick \( -size 100x100 xc:"rgb(80,0,0)" -depth 8 -set colorspace RGB \)   \( -size 100x100 xc:red -evaluate Multiply 5 \) +append  gainmap.png
magick -define uhdr:hdr-color-transfer=hlg -define uhdr:sdr-color-gamut=bt709 -define uhdr:hdr-color-gamut=bt2100 -define uhdr:gainmap-quality=70 -define uhdr:output-color-transfer=srgb   \( -size 200x100 xc:red -depth 8 -set colorspace RGB \)  \( gainmap.png -depth 16 \) uhdr:ultrahdr.jpg
```

## Changes to the Ultra HDR file format

XMP metadata is current needed to use the [ThreeJS UHDR Loader](https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/UltraHDRLoader.js)

One might need to recompile `libultrahdr` to enbale XMP gain map mode, use [`-DUHDR_WRITE_XMP=1 -D UHDR_WRITE_ISO=0`](https://github.com/google/libultrahdr/blob/main/docs/building.md) when rinning `cmake`.

To test:

```
exiftool -xmp:all tests/site/public/images/red-ultrahdr.jpeg
```

If the call doesn't return XMP / XML, the file can't be loaded using the UHDR ThreeJS loader.
