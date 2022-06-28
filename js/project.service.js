/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/
const _ = require("lodash");
const ObjectId = require("mongodb").ObjectID;
const { PROJECTTYPE, SRCS, LABELTYPE, ROLES, SOURCE, OPERATION } = require("../config/constant");
const config = require('../config/config');
const validator = require('../utils/validator');
const mongoDb = require('../db/mongo.db');
const { getModelProject } = require('../utils/mongoModel.utils');
const { ProjectModel, UserModel, LogModel } = require('../db/db-connect');
const { default: axios } = require("axios");
async function getProjects(req) {
    console.log(`[ PROJECT ] Service getProjects query user role`);
    const src = req.query.src;
    const email = req.auth.email;
    const user = await mongoDb.findById(UserModel, email);
    
    let condition, project=null;
    const options = { sort: { updatedDate: -1 } };
    if (src == SRCS.ANNOTATE) {
        console.log(`[ PROJECT ] Service query current annotator project list`);
        const annotateConditions = { annotator: { $regex: email } };
        const logReviewConditions = { creator: { $regex: email }};
        condition = { $or: [ annotateConditions, logReviewConditions ] };        
    } else if (src == SRCS.PROJECTS && user.role != "Annotator") {
        condition = { creator: { $regex: email } };
    } else if (src == SRCS.ADMIN && user.role == "Admin") {
        condition = {};
    } else if (src == SRCS.COMMUNITY) {
        console.log(`[ PROJECT ] Service query current user datasets list`);
        condition = { shareStatus: true };
        project = "projectName shareDescription creator updatedDate totalCase projectCompleteCase userCompleteCase categoryList generateInfo downloadCount labelType min max projectType isMultipleLabel popUpLabels integration";
    } else {
        console.log(`[ PROJECT ] [ERROR] Service errors in ${email} or ${src}`);
        throw { CODE: 1001, MSG: "ERROR ID or src" };
    }
    if(req.query.projectType){
        condition['projectType'] = req.query.projectType;
        project = "creator annotator selectedColumn integration projectName categoryList labelType projectType";
    }
    console.log(`[ PROJECT ] Service query user: ${email} src:  ${src} project list`);
    return mongoDb.findByConditions(ProjectModel, condition, project, options);
}
async function getProjectByAnnotator(req) {
    console.log(`[ PROJECT ] Service query project name by annotator: ${req.auth.email}`);
    const condition = { annotator: { $regex: req.auth.email } };
    const columns = "projectName";
    return mongoDb.findByConditions(ProjectModel, condition, columns);
}
async function getProjectName(req) {
    return checkProjectName(req.query.pname);
}
async function checkProjectName(pname) {
    console.log(`[ PROJECT ] Service query project name by projectName: ${pname}`);
    return mongoDb.findByConditions(ProjectModel, { projectName: pname });
}
async function getProjectInfo(req) {
    console.log(`[ PROJECT ] Service query Project info by pid: ${req.query.pid}`);
    let project = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
    if (project && project.labelType == LABELTYPE.HIERARCHICAL) {
        let labels = JSON.parse(project.categoryList);
        await prepareSelectedHierarchicalLabels(labels, true);
        project.categoryList = JSON.stringify(labels);
    }
    return project;
}
async function prepareSelectedHierarchicalLabels(nodes, unEnable){
	for (let i in nodes) {
        while(true){
            if(nodes[i] && nodes[i].enable == 0){
                nodes.splice(i, 1);
            }else{
                break;
            }
        }
	
