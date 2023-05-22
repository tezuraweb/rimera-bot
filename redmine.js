const NodeRedmine = require('node-redmine');
const User = require('./models/User--1');

// Документация api redmine - issues
// https://www.redmine.org/projects/redmine/wiki/Rest_Issues

class RedmineUser extends NodeRedmine {
  constructor(host, config) {
    super(host, config);
  }

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      super.current_user({}, (e, data) => {
        if (e) {
          reject({ error: true, e });
        } else {
          if (!data || !data.user) {
            reject({ error: true, e: 'hello mf' });
          } else {
            // console.log(data.firstname);
            resolve(data);
          }
        }
      });
    });
  }

  getMyIssues() {
    return new Promise((resolve, reject) => {
      super.issues({ limit: 50, assigned_to_id: 'me' }, (e, data) => {
        if (e) {
          reject({ error: true, e });
        } else {
          if (!data || !data.issues) {
            reject({ error: true, e: 'hello mf' });
          } else {
            // console.log(data.issues);
            resolve(data.issues);
          }
        }
      });
    });
  }
}

module.exports = {
  RedmineUser: RedmineUser,
};
