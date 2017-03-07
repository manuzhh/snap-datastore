# snap-datastore

Dieses Modul bildet die Schnittstelle zur Datenbank und wurde für die Module User und Content aus dem oh.snap Paket zur
Datenerstellung, -abfrage und -manipulation entwickelt. Theoretisch kann die API des Moduls für beliebige Pakete verwendet werden,
dabei ist nur zu beachten, dass hier eine feste Datenstruktur hinterlegt ist. 

## Installation
```console
nmp install snap-datastore --save
```

## Einbinden
```
const DB = require("snap-datastore")
```
