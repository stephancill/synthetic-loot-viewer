/* This is a terrible hack to fix an issue with compilation of files 
using module.exports. The fix is to add the sourceType: "unambiguous" 
to the babel-loader Webpack plugin as seen in:
https://github.com/facebook/create-react-app/issues/6163#issuecomment-457724292
*/
module.exports = function override(config, env) {
  config.module.rules[2].oneOf[1].options["sourceType"] = "unambiguous"
  return config;
}


