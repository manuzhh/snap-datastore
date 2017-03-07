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
```
const _ds = require("snap-datastore")
```

## API
Die API umfasst folgende Funktionen. Die callback-Funktion erwartet bei jeder Funktion zwei Parameter. In dem ersten Parameter wird der Fehlercode von der Datenbank übergeben, in diesem Falle ist der zweite Parameter null. Wenn kein Fehler auftritt so wird der erste Parameter null sein und im zweiten Parameter wird der Rückgabewert gespeichert. Der zweite Parameter kann ein Objekt oder eine Liste von Objekten sein.  
### 1. init(config)
Muss vor der Nutzung der nachfolgender Funktionen und nach dem Einbinden aufgerufen werden. Die Datenbankconfiguration wird in dem config-Parameter übergeben.
#### Beispielconfiguration für MongoDB
```
{   
    "type": "mongodb",
    "host": "mongodb://localhost:27017/",
    "dataStore": "test",
    "login": "",
    "password": ""
}
```

#### Beispielconfiguration für Neo4J
```
{   
    "type": "neo4j",
    "host": "localhost:7474/browser/",
    "dataStore": "",
    "login": "neo4j",
    "password": "test"
}
```
### 2. createNode = (collection, node, callback)
### 3. createConnection = (collection, userIdFrom, userIdTo, data, callback)
### 4. createContent = (content_collection, user_collection, userIdFrom, data, callback)
### 5. updateNode = (collection, id, newData, callback)
### 6. updateConnection = (collection, userIdFrom, userIdTo, newData, callback)
### 7. findNode = (collection, find, callback)
### 8. deleteNode = (collection, obId, callback)
### 9. deleteConnection = (collection, userIdFrom, userIdTo, callback)

## Verwendungsbeispiel
### Anlegen eines Users
```
_ds.createNode('user', {name:'Alice'}, (err, results) => { 
  if(err) console.log(err) 
  if(results) console.log(JSON.stringify(resuts))
})
```
