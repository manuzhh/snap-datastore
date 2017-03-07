"use strict"

const cypherTools = require("cypher-tools")

let _connectionDetails = null
let _dbConnect = null

let content, content_properties, content_id, deleted
let follow, followed, from, to, connect_properties, user_collection

let connect = (callback) => {
    if (_connectionDetails) {
        if (_dbConnect === null) {
            let neo4j = require('neo4j')
            if (!neo4j) {
                callback('require(neo4j) nicht erfolgreich', null)
            } else {
                _dbConnect = new neo4j.GraphDatabase('http://' + _connectionDetails.login + ':' + _connectionDetails.password + '@' + _connectionDetails.host)
                if (!_dbConnect) {
                    callback("Neo4jGraphDbWrapper: Database connection error ", null)

                } else {
                    if (callback) {
                        callback(null, _dbConnect)
                    }
                }
            }
        } else {
            if (callback) {
                callback(null, _dbConnect)
            }
        }
    } else {
        callback("Neo4jGraphDbWrapper: You need to call init before you call any other function", null)
    }
}

exports.init = (connectionDetails, collectionsConfig) => {
    _connectionDetails = connectionDetails

    deleted = collectionsConfig.deleteduser

    content = collectionsConfig.content_list
    content_properties = collectionsConfig.content_properties
    content_id = collectionsConfig.content_id

    follow = collectionsConfig.follow_list
    followed = collectionsConfig.followed_list
    from = collectionsConfig.follow_id_from
    to = collectionsConfig.follow_id_to
    connect_properties = collectionsConfig.connect_properties
    user_collection = collectionsConfig.userDataCollectionName
}

exports.insertNode = (label, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            if (callback) callback(err, null)
        } else {
            let data2 = data
            let data3 = data
            exports.findNode(label, data, (err, resultsBevor)=> {
                let strData = repair(data2)
                let cyper = 'CREATE (:' + label + ' ' + strData + ')'
                dbConnect.cypher({
                    query: cyper
                }, function (err, results) {
                    if (callback) {
                        if (err) {
                            callback(err, null)
                        } else {
                            exports.findNode(label, data3, (err, results)=> {
                                let resultt
                                //console.log('bevore ' + JSON.stringify(resultsBevor))
                                //console.log('danach ' + JSON.stringify(results))
                                if (resultsBevor[0]) {
                                    for (let i in results) {
                                        for (let j in resultsBevor) {
                                            if (results[i]._id != resultsBevor[j]._id) {
                                                resultt = results[i]
                                                break
                                            }
                                        }
                                    }
                                    callback(null, resultt)
                                } else {
                                    callback(null, results[0])
                                }
                            })
                        }
                    }
                })
            })
        }
    })
}


exports.insertConnection = (relation, userIdFrom, userIdTo, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            if (callback) callback(err, null)
        } else {
            let strData = repair(data)
            let cyper = 'MATCH (fromNode), (toNode) WHERE ID(fromNode)=' + userIdFrom + ' and ID(toNode)=' + userIdTo + ' CREATE (fromNode)-[:USER_RELATION' + '' + strData + ']->(toNode)'
            //console.log(cyper)
            dbConnect.cypher({
                query: cyper
            }, function (err, results) {
                if (err) {
                    if (callback) callback(err, null)
                } else {
                    exports.findNode(relation, {_id: userIdFrom}, function (err, results) {
                        if (err) {
                            if (callback) callback(err, null)
                        } else {
                            if (callback) callback(null, results)
                        }
                    })
                }
            })
        }
    })
}

exports.insertContent = (col_content, col_user, userIdFrom, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            if (callback) callback(err, null)
        } else {
            let strData = repair(data)
            let cyper = 'CREATE (:' + col_content + ' ' + strData + ')'
            dbConnect.cypher({
                query: cyper
            }, function (err, results) {
                if (err) {
                    if (callback) callback(err, null)
                } else {
                    //content wird angelegt
                    let cyper = 'MATCH (nodes:' + col_content + ' ' + strData + ') return nodes'
                    dbConnect.cypher({
                        query: cyper
                    }, function (err, results) {
                        if (err) {
                            if (callback) callback(err, null)
                        } else {
                            results = repair_results(results)
                            //ToDo for-schleife ergänzen, falls mehrere contents mit gleichem inhalt gibt?
                            let id = results[0]._id
                            let newData = {[content]: {[content_id]: id, [content_properties]: strData}}
                            //Die Kante vom User zu dem Content wird angelegt
                            cyper = 'MATCH (fromNode:' + col_user + '), (toNode:' + col_content + ') ' +
                                'WHERE ID(fromNode)=' + userIdFrom + ' and ID(toNode)=' + id +
                                ' CREATE (fromNode)-[:CONTENT_RELATION ' + strData + ']->(toNode)'
                            connect(() => {
                                dbConnect.cypher({
                                    query: cyper
                                }, function (err, results) {
                                    if (err) {
                                        if (callback) callback(err, null)
                                    } else {
                                        results = repair_results(results)
                                        if (callback) callback(null, results)
                                    }
                                })
                            })
                        }
                    })
                }
            })
        }
    })
}

exports.updateNode = (label, nodeId, newData, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            if (callback) callback(err, null)
        } else {
            let strData = repair(newData)
            let cyper = 'MATCH (node:' + label + ') WHERE ID(node)=' + nodeId + ' SET node +=' + strData
            //console.log(cyper)
            dbConnect.cypher({
                query: cyper
            }, function (err, results) {
                if (err) {
                    if (callback) callback(err, null)
                } else {
                    exports.findNode(label, {_id: nodeId}, function (err, results) {
                        if (err) {
                            if (callback) callback(err, null)
                        } else {
                            if (callback) callback(null, results)
                        }
                    })
                }
            })
        }
    })
}

exports.updateConnection = (label, userIdFrom, userIdTo, newData, callback)=> {
    let strData = repair(newData)
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            /*dbConnect.cypher({
             query: 'MATCH ()-[edge:' + label + ']-() WHERE ID(edge)=' + edgeId + ' SET edge +=' + strData

             }, function (err, results) {
             if (err) {
             callback(err, null)
             } else {
             results = repair_results(results)
             callback(null, results)
             }
             })*/
            /*ToDo
             * 1. Verbindungskante Von user mit der Id userIdFrom zum User mit der Id userIdTo finden
             * 2. Die Id der Verbindungskante rauslesen und über die die Properties updaten
             * 3. Den User mit der Id userIdFrom rauslesen und an die callback funktion übergeben
             * */
        }
    })
}

exports.findNode = (label, find, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            if (callback) callback(err, null)
        } else {
            let strData = repair(find)
            let cyper = 'MATCH (nodes:' + label + ' ' + strData + ') return nodes'
            //console.log('cypher in find ' + cyper)
            dbConnect.cypher({
                query: cyper
            }, function (err, results) {
                if (err) {
                    if (callback) callback(err, null)
                } else {
                    results = repair_results(results)
                    if (label != [user_collection]) {
                        find_connect(results, label, strData, function (err, results) {
                            if (err) {
                                if (callback) callback(err, null)
                            } else {
                                find_content(results, label, strData, function (err, results) {
                                    if (err) {
                                        if (callback) callback(err, null)
                                    } else {
                                        if (callback) callback(null, results)
                                    }
                                })
                            }
                        })
                    } else {
                        if (callback) callback(null, results)
                    }
                }
            })
        }
    })
}


//wird nicht mehr gebraucht
/*exports.findEdge = (label, find, callback) => {
 connect((err, dbConnect) => {
 if (err) {
 callback(err, null)
 } else {
 let strData = repair(find)
 let cyper = 'MATCH ()-[edges:' + label + ' ' + strData + ']-() return edges'
 //console.log(cyper)
 dbConnect.cypher({
 query: cyper

 }, function (err, results) {
 if (err) {
 callback(err, null)
 } else {
 results = repair_results(results)
 callback(null, results)
 }
 })
 }
 })
 }*/

/*
 *  DETACH DELETE n-> lösche den Knoten und alle Kanten von diesem Knoten
 * */
exports.deleteNode = (label, nodeId, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            /*
             * ToDo:
             * 1. statt zu löschen nur [deleted] auf true setzen
             * 2. den Object mit der Id nodeId an die callback funktion weitergeben
             * */
            /*dbConnect.cypher({
             query: 'MATCH (node:' + label + ') WHERE ID(node)=' + nodeId + ' DETACH DELETE node'
             }, function (err, results) {
             if (err) {
             callback(err, null)
             } else {
             results = repair_results(results)
             callback(null, results)
             }
             })*/
        }
    })
}

/*
 * MATCH ()-[n]-() WHERE ID(n)= 0 RETURN n
 * */
exports.deleteConnection = (collection, userIdFrom, userIdTo, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            /*ToDo
             * 1. Verbindungskante Von user mit der Id userIdFrom zum User mit der Id userIdTo finden
             * 2. Die Id der Verbindungskante rauslesen und löschen
             * 3. Den User mit der Id userIdFrom rauslesen und an die callback funktion übergeben
             * */
            /*let cyper = 'MATCH ()-[edge]-() WHERE ID(edge)=' + edgeId + ' DELETE edge'
             //console.log(cyper)
             dbConnect.cypher({
             query: cyper

             }, function (err, results) {
             if (err) {
             callback(err, null)
             } else {
             results = repair_results(results)
             callback(null, results)
             }

             })*/
        }
    })
}
/*
 * ToDo:
 * diese Funktion wird zunächst nur für Neo4j gebraucht, um String-Values in einfache Gänsefüßchen zu packen,
 * denn cyper akzeptiert die sonst nicht und wirft ein Syntaxfehler
 * */
function repair(data) {
    for (let i in data) {
        /*ToDo
         * falls data _id enthält sollte man die rauslöschen
         * und bei der cypher anfrage in die where klausel in der Form von ID() packen
         * */
        if (typeof data[i] === 'string' || typeof data[i] === 'number') {
            //console.log('repair ' + data[i] + ' instanceof STRING oder number ist true = ' + data[i])
        } else {
            data[i] = JSON.stringify(data[i])
        }
    }
    return cypherTools.objToString(data)
}

/*
 * für Neo4j wird die _id in die properties eingefügt und diese werden dann zurückgegeben
 * */
function repair_results(results) {
    if (results[0]) {
        for (let i = 0; i < results.length; i++) {
            results[i].nodes.properties._id = results[i].nodes._id
            results[i] = results[i].nodes.properties
        }
    }
    return results
}

function find_content(results, label, strData, callback) {
    connect((err, dbConnect) => {
        if (err) {
            if (callback) callback(err, null)
        } else {
            let acontent = new Array()
            let cyper = 'MATCH (nodes:' + label + ' ' + strData + ') -[r:CONTENT_RELATION]->(c) return c'
            dbConnect.cypher({
                query: cyper
            }, function (err, relation) {
                if (err) {
                    if (callback) callback(err, null)
                } else {
                    if (relation[0]) {
                        for (let i = 0; i < relation.length; i++) {
                            if (acontent.indexOf(relation[i].c._toId) < 0) {
                                acontent[i] = relation[i].c._toId
                            }
                        }
                    }
                    for (let i = 0; i < results.length; i++) {
                        results[i][content] = acontent
                    }
                    if (callback) callback(null, results)
                }
            })
        }
    })
}

function find_connect(results, label, strData, callback) {
    let cyper = 'MATCH (nodes:' + label + ' ' + strData + ') <-[r:USER_RELATION]->() return r'
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            dbConnect.cypher({
                query: cyper
            }, function (err, relation) {
                if (err) {
                    if (callback) callback(err, null)
                } else {
                    let afollow = new Array(), afollowed = new Array(), acontent = new Array()
                    if (relation[0]) {
                        for (let i = 0; i < relation.length; i++) {
                            if (results[0]._id != relation[i].r._fromId) {
                                afollowed[i] = {
                                    [from]: relation[i].r._fromId,
                                    [properties]: relation[i].r.properties
                                }
                            }
                            if (results[0]._id == relation[i].r._fromId) {
                                afollow[i] = {
                                    [to]: relation[i].r._toId,
                                    [properties]: relation[i].r.properties
                                }
                            }
                        }
                    }
                    for (let i = 0; i < results.length; i++) {
                        results[i][follow] = afollow
                        results[i][followed] = afollowed

                        if (!results[i].hasOwnProperty([content])) {
                            results[i][content] = acontent
                        }
                    }
                    if (callback) callback(null, results)
                }
            })
        }
    })
}