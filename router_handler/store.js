const { get } = require("../routes/metaConfig");

// 保存 metagpt 启动附加指令
let globalStore = {
  nround: 5,
  codeReview: true,
  codeTest: false
};

module.exports = {
  getStore: () => globalStore,
  setStore: (params) => {
    globalStore = params;
  }
};