"use strict"

const cypherTools = require("cypher-tools")

let _connectionDetails = null
let _dbConnect = null

let content, content_properties, content_id, deleted
let follow, followed, from, to, connect_properties

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
}

/*
 * z.B. label = USER,  data = {name:"Alice", age:17}
 * */
exports.insertNode = (label, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let strData = repair(data)
            let cyper = 'CREATE (:' + label + ' ' + strData + ')'
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
}

/*
 * z.B. label = CONNECTION
 * MATCH (a:col1), (b:col1) WHERE ID(b)=9 and ID(a)=8
 * CREATE (a)-[r:LOVES]->(b)
 * */
exports.insertEdge = (relation, userIdFrom, userIdTo, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let strData = repair(data)
            let cyper = 'MATCH (fromNode), (toNode) WHERE ID(fromNode)=' + userIdFrom + ' and ID(toNode)=' + userIdTo + ' CREATE (fromNode)-[:' + relation + ' ' + strData + ']->(toNode)'
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
}

exports.insertContent = (col_content, col_user, userIdFrom, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let strData = repair(data)
            let cyper = 'CREATE (:' + col_content + ' ' + strData + ')'
            dbConnect.cypher({
                query: cyper
            }, function (err, results) {
                if (err) {
                    callback(err, null)
                } else {
                    //content wird angelegt
                    let cyper = 'MATCH (nodes:' + col_content + ' ' + strData + ') return nodes'
                    dbConnect.cypher({
                        query: cyper
                    }, function (err, results) {
                        if (err) {
                            callback(err, null)
                        } else {
                            results = repair_results(results)
                            //ToDo for-schleife ergänzen, falls mehrere contents mit gleichem inhalt gibt?
                            let id = results[0]._id
                            let newData = {[content]: {[content_id]: id, [content_properties]: strData}}
                            //Die Kante vom User zu dem Content wird angelegt
                            //ToDo hier zunächst CONTENT_RELATION, wird beim find genutzt zum Unterscheiden von follow und followed kanten
                            cyper = 'MATCH (fromNode:' + col_user + '), (toNode:' + col_content + ') ' +
                                'WHERE ID(fromNode)=' + userIdFrom + ' and ID(toNode)=' + id +
                                ' CREATE (fromNode)-[:CONTENT_RELATION ' + strData + ']->(toNode)'

                            connect(() => {
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
                            })
                        }
                    })
                }
            })
        }
    })
}

/*
 * MATCH (s:col1) WHERE ID(s) = 5 set s += {name:"Testname", alter:1}
 * */

exports.updateNode = (label, nodeId, newData, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let strData = repair(newData)
            let cyper = 'MATCH (node:' + label + ') WHERE ID(node)=' + nodeId + ' SET node +=' + strData
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
}

/*
 * MATCH ()-[edges:testrel {prop:'schoen'}]-() set edges += {p2:'schoen2'}
 * */
exports.updateEdge = (label, edgeId, newData, callback) => {
    let strData = repair(newData)
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            dbConnect.cypher({
                query: 'MATCH ()-[edge:' + label + ']-() WHERE ID(edge)=' + edgeId + ' SET edge +=' + strData

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
}

/*
 * find entspricht einem JSON-Object, z.B {"name":"Testname", "alter":"testalter"}
 * MATCH (s:col1 {name:"Testname", alter:1})return s
 * */
exports.findNode = (label, find, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let strData = repair(find)
            let cyper = 'MATCH (nodes:' + label + ' ' + strData + ') return nodes'
            dbConnect.cypher({
                query: cyper
            }, function (err, results) {
                if (err) {
                    callback(err, null)
                } else {
                    if (results[0]) {
                        results = repair_results(results)
                        //ToDo: auslagern
                        //results = find_connect(results, label, strData)//funktioniert nicht
                        //ToDo: auslagern
                        //results = find_content(results)
                        //ToDo: sicherstellen wie die collection für contents heißt-> über config?
                        if (label != 'test_content') {
                            let acontent = new Array()
                            cyper = 'MATCH (nodes:' + label + ' ' + strData + ') -[r:CONTENT_RELATION]->() return r'
                            dbConnect.cypher({
                                query: cyper
                            }, function (err, relation) {
                                if (err) {
                                    callback(err, null)
                                } else {
                                    if (relation[0]) {
                                        for (i = 0; i < relation.length; i++) {
                                            if (acontent.indexOf(relation[i].r._toId) < 0) {
                                                acontent[i] = relation[i].r._toId
                                            }
                                        }
                                    }
                                    for (let i = 0; i < results.length; i++) {
                                        results[i][content] = acontent
                                    }
                                }
                            })
                            //ToDo auch hier -> tet_jasmine ersetzen
                            cyper = 'MATCH (nodes:' + label + ' ' + strData + ') <-[r:tet_jasmine]->() return r'
                            dbConnect.cypher({
                                query: cyper
                            }, function (err, relation) {
                                if (err) {
                                    callback(err, null)
                                } else {
                                    let afollow = new Array(), afollowed = new Array()
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
                                        //leere Liste einfügen
                                        if (!results[0].hasOwnProperty([content])) {
                                            results[0][content] = acontent
                                        }
                                    }
                                    callback(null, results)
                                }
                            })
                        } else {
                            callback(null, results)
                        }
                    }
                }
            })
        }
    })
}


/*
 * find entspricht einem JSON-Object, z.B {"name":"Testname", "alter":"testalter"}
 * MATCH (s:col1 {name:"Testname", alter:1})return s
 * */
exports.findEdge = (label, find, callback) => {
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
}

/*
 *  DETACH DELETE n-> lösche den Knoten und alle Kanten von diesem Knoten
 * */
exports.deleteNode = (label, nodeId, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            dbConnect.cypher({
                query: 'MATCH (node:' + label + ') WHERE ID(node)=' + nodeId + ' DETACH DELETE node'
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
}

/*
 * MATCH ()-[n]-() WHERE ID(n)= 0 RETURN n
 * */
exports.deleteEdge = (edgeId, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let cyper = 'MATCH ()-[edge]-() WHERE ID(edge)=' + edgeId + ' DELETE edge'
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
}
/*
 * ToDo:
 * diese Funktion wird zunächst nur für Neo4j gebraucht, um String-Values in einfache Gänsefüßchen zu packen,
 * denn cyper akzeptiert die sonst nicht und wirft ein Syntaxfehler
 * */
function repair(data) {
    for (let i in data) {
        if (!(data[i] instanceof String || data[i] instanceof Number)){
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
