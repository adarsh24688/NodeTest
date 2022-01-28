let {GITHUB_URL} = require("../utils/constant")
const { gql,GraphQLClient } = require('graphql-request');
const { Octokit } = require("@octokit/rest");

exports.getRepos = async (req,res)=>{
    let {token ,username} = req.body;
    console.log(token, username,"<====")
    const headers = { Authorization: `bearer ${token}` };
    let data =  new GraphQLClient(GITHUB_URL, { headers });
    console.log(data,"<===data=")
    const variables = {};
    const query = gql`{
      repositoryOwner(login: "${username}") {
        repositories(first: 50) {
          nodes {
            name
            diskUsage
            owner {          
              login
            }
          }
        }
      }
    }`;
    const repoData = await data.request(query, variables);
    const { nodes } = repoData.repositoryOwner.repositories;
    res.status(200).json({"data":repoData})
   }



exports.getRepositoryDetails = async (req,res)=>{
    let {repoName ,username,token} = req.body;
    const headers = { Authorization: `bearer ${token}` };
    let graphData =  new GraphQLClient(GITHUB_URL, { headers });
    console.log(repoName, username,token,"<====")
    const variables = {};
    const query = gql`{
      repository(owner: "${username}", name: "${repoName}") {
        name
        diskUsage
        isPrivate
        owner {
          login
        }   
        object(expression: "HEAD:") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  byteSize                  
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        byteSize                        
                      }
                    }
                  }
                }
              }
            }
          }
        }        
      }  
    }
  `;
    const data = await graphData.request(query, variables);
    let response = [];

      const { name, diskUsage, isPrivate } = data.repository;
      const { login } = data.repository.owner;    
      let entries = JSON.parse(JSON.stringify(data.repository.object)); 
      const  {folderCount,fileCount} = await getNoOfFiles(entries);   
      const activeWebhooks = await getActiveWebhooks(username, repoName,token );  
      const {text,haveYmlFile} = await haveYmlFiles(entries,username,repoName);
      response.push({
        "Repository Name": name,
        "Repository Size":diskUsage,
        "Repository Owner":login,
        "Repository is Private":isPrivate,
        "Number of Files on Root Level":fileCount,  
        "Number of Folders on Root Level":folderCount,
        "Have YML File":haveYmlFile,
        "Content of YML File":text,
        "Active Webhooks":activeWebhooks     
      });
    res.status(200).json({"data":response})
   }

    //function to check if yml file is present in the root of repository
  async function haveYmlFiles (filesArr,repoOwnerName,repoName) {    
   
    let text = '';
    for(var i=0;i<filesArr.entries.length;i++){ 
      let splitArr = filesArr.entries[i].name.split('.');
      if(splitArr[1]){        
        if(await validateFileExtension(filesArr.entries[i].name,'yml')) {      
          //get yml file content
          let variables = {};
          let query = gql`{repository(owner: "${repoOwnerName}", name: "${repoName}") {
            content: object(expression: "HEAD:${splitArr[0]}.yml") {
              ... on Blob {
                text
              }
            }
          }}`;
          let data = await this.graphqlClient.request(query, variables);
          return {text:data.repository.content.text,haveYmlFile:true}; 
       }  
      }        
    }   
    return {text:text,haveYmlFile:false}; 
  }

  //function to get number of files in 1st level of repository
  async function getNoOfFiles(filesArr) {
    let files = 0;
    let folders = 0;

    const listOf1stLevelFiles = filesArr.entries.filter(it => it.type === 'blob');
    const listofDirectories = filesArr.entries.filter(it => it.type === 'tree');

    files += listOf1stLevelFiles.length;
    folders += listofDirectories.length;   

    return {folderCount:folders, fileCount:files };
  }

  //function to get active webhooks
  async function getActiveWebhooks(repoOwnerName, repoName ,token) {
      const octokit = new Octokit({
        auth: token,
      });

      try{
        const response = await octokit.rest.repos.listWebhooks({
          owner: repoOwnerName,
          repo: repoName
        })

        if(response.data.length < 1){
          return "No wenhook";	
        } else {
          return res.data;
        }
      } catch(err) {
        return "No wenhook";
      }
  }



async function validateFileExtension(){
    try{
        let validExtension = false;
        if(filename.split('.')[1].toString().trim().toLowerCase() === extension){
            validExtension = true;
        } else{
            validExtension = false;
        }
        return validExtension;
     
    }catch(err){
        return false;
    }
}