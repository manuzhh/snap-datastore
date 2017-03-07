# snap-datastore

Dieses Modul bildet die Schnittstelle zur Datenbank und wurde für die Module User und Content aus dem oh.snap Paket zur
Datenerstellung, -abfrage und -manipulation entwickelt. Theoretisch kann die API des Moduls für beliebige Pakete verwendet werden,
dabei ist nur zu beachten, dass hier eine feste Datenstruktur hinterlegt ist. 

## Installation
```console
nmp install snap-datastore --save
```

## Unterstützte Datenbanken
### MongoDB
Die API ist funktionsfähig
### Neo4j
Die API befindet sich noch in der Entwicklungsphase

## Einbinden
``` JavaScript
const _ds = require("snap-datastore")
```

## API
Die API umfasst die nachfolgenden Funktionen. Die callback-Funktion erwartet bei jeder Funktion zwei Parameter. In dem ersten Parameter wird der Fehlercode von der Datenbank übergeben, in diesem Falle ist der zweite Parameter null. Wenn kein Fehler auftritt so wird der erste Parameter null sein und im zweiten Parameter wird der Rückgabewert gespeichert. Der zweite Parameter kann ein Objekt oder eine Liste von Objekten sein.  
### Initialisieren
Muss vor der Nutzung der nachfolgender Funktionen und nach dem Einbinden aufgerufen werden. Die Datenbankkonfiguration wird in dem config-Parameter übergeben.
##### Beispielkonfiguration für MongoDB
``` JavaScript
_ds.init({   
    "type": "mongodb",
    "host": "mongodb://localhost:27017/",
    "dataStore": "test",
    "login": "",
    "password": ""
})
```

##### Beispielkonfiguration für Neo4J
``` JavaScript
_ds.init({     
    "type": "neo4j",
    "host": "localhost:7474/browser/",
    "dataStore": "",
    "login": "neo4j",
    "password": "test"
})
```
### Node anlegen
``` JavaScript
createNode = (collection, node, callback)
```
### Edge anlegen
``` JavaScript
createConnection = (collection, userIdFrom, userIdTo, data, callback)
```
### Content anlegen
``` JavaScript
createContent = (content_collection, user_collection, userIdFrom, data, callback)
```
### Node- oder Content-Eigenschaften ändert oder ergänzen
``` JavaScript
updateNode = (collection, id, newData, callback)
```
### Edge-Eigenschaften ändern oder ergänzen
``` JavaScript
updateConnection = (collection, userIdFrom, userIdTo, newData, callback)
```
### Node oder Content nach find-Kriterien suchen
``` JavaScript
findNode = (collection, find, callback)
```
### Node als gelöscht markieren
``` JavaScript
deleteNode = (collection, obId, callback)
```
### Edge löschen
``` JavaScript
deleteConnection = (collection, userIdFrom, userIdTo, callback)
```

## Verwendungsbeispiele
### Anlegen eines Users
``` JavaScript
_ds.createNode('user', {name:'Alice'}, (err, results) => { 
  if(err) console.log(err) 
  if(results) console.log(JSON.stringify(resuts))
})
```
#### Rückgabewert:
``` JavaScript
resuts = {_id:'s4gt658imsla', name:'Alice'}
```

### Suchen nach einem Users
``` JavaScript
_ds.findNode('user', {name:'Alice'}, (err, results) => { 
  if(err) console.log(err) 
  if(results) console.log(JSON.stringify(resuts))
})
```
#### Rückgabewert:
``` JavaScript
resuts[0] = {_id:'s4gt658imsla', name:'Alice'}
```
