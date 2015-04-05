# GPS Babel - Universal GPS data format converter #

Homepage: [www.gpsbabel.org](http://www.gpsbabel.org/)

  * convert gps file from gpx to kml:
```
gpsbabel -rtw -i gpx -f ./input.gpx -o kml -F output.kml
```

  * and back from kml to gpx:
```
gpsbabel -rtw -i kml -f ./input.kml -o gpx -F output.gpx
```


  * conversion from and to kml/kmz (kmz is simply gziped kml data)
```
zcat data.kmz > data.kml
cat data.kml | gzip > data.kmz
```

  * merge two (or more) tracks into one file
```
gpsbabel -i gpx -f track1.gpx -f track2.gpx -o gpx -F merged.gpx
```

  * discard points with high horizontal and/or vertical inaccuracy (gpx format only, kml format don't contains hdop/vdop values)
```
gpsbabel -i gpx -f in.gpx -x discard,hdop=30,vdop=60,hdopandvdop -o gpx -F out.gpx
gpsbabel -i gpx -f in.gpx -x discard,hdop=30,vdop=60,hdoporvdop  -o gpx -F out.gpx
```


# Marble - Amazing KDE application for viewing maps and gps data #

Homepage: [edu.kde.org/marble](http://edu.kde.org/marble/)

<a href='http://mojotracker.googlecode.com/svn/wiki/images/apps/marble.png'><img src='http://mojotracker.googlecode.com/svn/wiki/images/apps/marble.png' alt='Marble with imported gps file' width='600' /></a>