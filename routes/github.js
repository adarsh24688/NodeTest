let express = require("express");
let  router = express.Router();
let repoController = require("../controller/gitController")

router.post("/getRepos",repoController.getRepos);
router.post("/getRepositoryDetails",repoController.getRepositoryDetails);

module.exports = router;