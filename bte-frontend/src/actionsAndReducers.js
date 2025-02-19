
import './index.css';

const Redux = require('redux');

const axios = require('axios');

//--Action creators (simple)--

export const advanceBallot = () => ({
type: "ADVANCE_BALLOT",
});
export const attemptBallotSubmission = () => ({
type: "ATTEMPT_BALLOT_SUBMISSION"
});
export const confirmBallotSubmission = () => ({
type: "CONFIRM_BALLOT_SUBMISSION"
});
export const failBallotSubmission = () => ({
type: "FAIL_BALLOT_SUBMISSION"
});
export const requestMoreBallots = () => ({
type: 'REQUEST_MORE_BALLOTS',
});
export const receiveMoreBallots = (ballots) => ({
type: 'RECEIVE_MORE_BALLOTS',
ballots: ballots
});
export const failReceiveMoreBallots = () => ({
type: 'FAIL_RECEIVE_MORE_g',
});
export const requestAuthKey= () => ({
type: "REQUEST_AUTH_KEY",
})
export const receiveAuthKey = (key) => ({
type: "RECEIVE_AUTH_KEY",
"key": key
})
export const failReceiveAuthKey = () => ({
type: "FAIL_RECEIVE_AUTH_KEY",
})
export const requestLatestAnimals= () => ({
type: "REQUEST_LATEST_ANIMALS",
})
export const receiveLatestAnimals = (animals) => ({
type: "RECEIVE_LATEST_ANIMALS",
animals: animals
})
export const failReceiveLatestAnimals = () => ({
type: "FAIL_RECEIVE_LATEST_ANIMALS",
})
export const showRankings = () => ({
  type: "SHOW_RANKINGS",
})
export const hideRankings = () => ({
  type: "HIDE_RANKINGS",
})

//--Action creators (do real work)--

export const submitBallotAndAdvance = (winnerSide) => {
return (dispatch, getState) => {
  console.log("SUBMIT BALLOT AND ADVANCE");
  dispatch(attemptBallotSubmission());
  //TODO: Needs tons more validation server side.
  var state = getState();
  var currentBallotID = state.ballots.ballotIDQueue[0];
  var authKey = state.authkey.key; //TODO: Need some logic if there is no key. Shouldn't happen but could maybe.
  dispatch(advanceBallotAndFetchMoreIfNeeded());
  console.log("SUBMITTING BALLOT...");
  var data = JSON.stringify({"WinnerSide" : winnerSide, "BallotID" : currentBallotID, "AuthKey": authKey});
  console.log("data:");
  console.log(data);

  return axios({
      method: 'put',
      url: "https://n6d28h0794.execute-api.us-east-1.amazonaws.com/Production/ballots/",
      "data": data,
      headers: {"Content-Type": "application/json"}
    }
  )
  .then(function (response) {
    dispatch(confirmBallotSubmission());
  }, function (error) {
    console.log(error);
    dispatch(failBallotSubmission());
  });
}
}
export const advanceBallotAndFetchMoreIfNeeded = () => {
return (dispatch, getState) => {
    console.log("ADVANCING BALLOT");
    dispatch(advanceBallot());
    dispatch(fetchMoreBallotsIfNeeded(getState()));
};
};
export const fetchMoreBallots = () => {
return function(dispatch, getState) {
  console.log("FETCHING MORE BALLOTS");
  dispatch(requestMoreBallots());
  var state = getState();
  var authKey = state.authkey.key;
  return axios
    .get(
        "https://n6d28h0794.execute-api.us-east-1.amazonaws.com/Production/ballots?authkey=" + encodeURIComponent(authKey)
    )
    .then(function (response) {
      console.log("RECEIVED MORE BALLOTS")
      console.log("response:");
      console.log(response);
      var newBallots = response.data;
      return dispatch(receiveMoreBallots(newBallots));
    }, function (error) {
      return dispatch(failReceiveMoreBallots());
    });
}};
export const fetchMoreBallotsIfNeeded = () => {
return (dispatch, getState) => {
  if (shouldFetchMoreBallots(getState())) {
    console.log("YES, FETCHING MORE BALLOTS");
    return dispatch(fetchMoreBallots());
  } else {
    console.log("NO, NOT FETCHING MORE BALLOTS");
    return Promise.resolve();
  }
}
}
export const fetchBallotsAndAnimalsIfNeeded = () => {
return function (dispatch, getState) {
  store.dispatch(fetchLatestAnimalsIfNeeded());
  store.dispatch(fetchMoreBallotsIfNeeded());
}
}
export const fetchAuthKey = (count) => {
return function(dispatch, getState) {
  dispatch(requestAuthKey());
  console.log("FETCHING AUTH KEY");
  return axios
    .get(
        "https://n6d28h0794.execute-api.us-east-1.amazonaws.com/Production/authkey"
    )
    .then(function (response) {
      console.log("RECEIVING AUTH KEY");
      console.log("response:");
      console.log(response);
      var authKey = response.data.AuthKey;
      return dispatch(receiveAuthKey(authKey));
    }, function (error) {
      console.log(error);
      return dispatch(failReceiveAuthKey());
    });
}};
export const fetchAuthKeyIfNeeded = () => {
return (dispatch, getState) => {
  if (shouldFetchMoreBallots(getState())) {
    return dispatch(fetchAuthKey());
  } else {
    return Promise.resolve();
  }
}
}
export const fetchLatestAnimals = () => {
return (dispatch, getState) => {
    dispatch(requestLatestAnimals);
    console.log("FETCHING LATEST ANIMALS");
    return axios.get('https://n6d28h0794.execute-api.us-east-1.amazonaws.com/Production/animals')
    .then(function (response) {
        console.log("FETCHING ANIMALS SUCCEEDED");
        console.log("response:");
        console.log(response);
        var allAnimals = JSON.parse(response.data.body);
        dispatch(receiveLatestAnimals(allAnimals));
      }, function (error){
        console.error(error);
        //dispatch(updateToLatestAnimalsFailure());
      });
    };
};
export const fetchLatestAnimalsIfNeeded = () => {
return (dispatch, getState) => {
  if (shouldFetchLatestAnimals(store.getState())) {
    return dispatch(fetchLatestAnimals());
  } else {
    return Promise.resolve();
  }
}
};

//--Reducers--

export function animals(state = {
isFetching: false,
didInvalidate: false,
animalStore: {},
rankOrder: [],
}, action
) {
switch (action.type) {
  case 'REQUEST_LATEST_ANIMALS':
    return Object.assign({}, state, {
      isFetching: true,
      didInvalidate: false
    });
  case 'RECEIVE_LATEST_ANIMALS':
    var result =  Object.assign({}, state, {
      isFetching: false,
      didInvalidate: false,
      animalStore: action.animals,
      rankOrder: rankAnimals(action.animals),
      lastUpdated: action.receivedAt});
    return result;
  default:
    return state;
}
}

export function ballots(state = {
isFetching: false,
didInvalidate: false,
ballotIDQueue: [],
ballotStore: {},
outgoingBallotID: null,
}, action) {
switch (action.type) {
  case 'ADVANCE_BALLOT':
    console.log("state at top is:");
    console.log(state);
    var currentOutgoingBallotID = state.outgoingBallotID;
    var newIncomingID = state.ballotIDQueue[1];
    var newOutgoingID = state.ballotIDQueue[0];

    var newState = Object.assign({}, state, {
      ballotIDQueue: state.ballotIDQueue.slice(1),
      lastUpdated: action.receivedAt
    });

    var newBallot1 = Object.assign({}, newState.ballotStore[newIncomingID], {
      QueueState : QUEUE_STATE.INCOMING,
    });
    var newBallot2 = Object.assign({}, newState.ballotStore[newOutgoingID], {
      QueueState : QUEUE_STATE.OUTGOING,
    });

    newState.ballotStore[newIncomingID] = newBallot1;
    newState.ballotStore[newOutgoingID] = newBallot2;

    if (currentOutgoingBallotID != null) {
      console.log("DELETING BALLOT WITH THE ID " + currentOutgoingBallotID);
      delete newState.ballotStore[currentOutgoingBallotID];
    }
    newState.outgoingBallotID = newOutgoingID;
    console.log("state at bottom is:");
    console.log(newState);
    console.log(newState === state);
    return newState;
  case 'REQUEST_MORE_BALLOTS':
    return Object.assign({}, state, {
      isFetching: true,
      didInvalidate: false
    });
  case 'RECEIVE_MORE_BALLOTS':
  console.log("RECEIVING MORE BALLOTS");
    var newState = Object.assign({}, state, {
      isFetching: false,
      didInvalidate: false,
      ballotIDQueue: state.ballotIDQueue.concat(_extractBallotIDs(action.ballots)),
      ballotStore: _storeAndPrepNewBallots(state.ballotStore, action.ballots),
      lastUpdated: action.receivedAt
    });

    //--Mark the items in ballot queue with appropriate queueState, if they aren't already.

    var newIncomingID = newState.ballotIDQueue[0];

    var newBallot1 = Object.assign({}, newState.ballotStore[newIncomingID], {
      QueueState : QUEUE_STATE.INCOMING,
    });

    newState.ballotStore[newIncomingID] = newBallot1;
    return newState;

  default:
    return state;
}
}
function _storeAndPrepNewBallots(ballotStore, newBallots) {
var newBallotStore = Object.assign({}, ballotStore, {
}); //TODO: Better way to copy?
console.log("STORE AND PREP NEW BALLOTS");
  for (var i = 0; i < newBallots.length; i++) {
    var newBallot = newBallots[i];
    newBallot.QueueState = QUEUE_STATE.HIDDEN; //TODO: Should this be elsewhere
    var newBallotID = newBallot.ID
    newBallotStore[newBallotID] = newBallot;
}
    return newBallotStore;
}
function _extractBallotIDs(newBallots) {
console.log("EXTRACTING BALLOT IDS FROM BALLOTS");
console.log("newBallots:");
console.log(newBallots);
var newBallotIDs = newBallots.map((newBallot) => {return newBallot.ID});
console.log("newBallotIDs:");
console.log(newBallotIDs);
return newBallotIDs;
}

export function authkey (state = {
isFetching: false,
didInvalidate: false,
key: null
}, action) {
switch (action.type) {
  case 'RECEIVE_AUTH_KEY':
    action.asyncDispatch(fetchBallotsAndAnimalsIfNeeded());
    return Object.assign({}, state, {
      isFetching: false,
      key: action.key,
      lastUpdated: action.receivedAt
  });
  case 'REQUEST_AUTH_KEY':
    return Object.assign({}, state, {
      isFetching: true,
      didInvalidate: false
    });
    //TODO: Fail state
  default:
    return state;
}
}



export function ui (state = {
focusArea : FOCUSAREA.INITIAL,
}, action) {
switch (action.type) {
  case 'SHOW_RANKINGS':
  console.log(state.focusArea);
  console.log("SHOW RANKINGS");
    return Object.assign({}, state, {
      focusArea: FOCUSAREA.RANKINGS
  });
  case 'HIDE_RANKINGS':
    return Object.assign({}, state, {
      focusArea: FOCUSAREA.BALLOTVIEWER
    });
    //TODO: Fail state
  default:
    return state;
}
}

const FOCUSAREA = {
  INITIAL : "show_initial",
  BALLOTVIEWER: "show_ballots",
  RANKINGS: "show_rankings"
};



//--Utility-functions--

function checkNested(obj /*, level1, level2, ... levelN*/) {
var args = Array.prototype.slice.call(arguments, 1);

for (var i = 0; i < args.length; i++) {
  if (!obj || !obj.hasOwnProperty(args[i])) {
    return false;
  }
  obj = obj[args[i]];
}
return true;
}
function rankAnimals(animalsMap) {
  var animalKeys = Object.keys(animalsMap);
  var animals = [];
  for (let animalKey of animalKeys) {
    var animal = animalsMap[animalKey];
    animal.ID = animalKey;
    animals.push(animal);
  }
  animals.sort(function (a, b) {
    var ratio_animal_a = (a.Wins + 1) / (a.Losses + 1);
    var ratio_animal_b = (b.Wins + 1) / (b.Losses + 1);
    if (ratio_animal_a === ratio_animal_b) {
      var alphabeticalOrder = [a.Name, b.Name].sort();
      if (alphabeticalOrder[0] === a.Name) {
        return -1;
      } else {
        return 1;
      }
    } else {
      if (ratio_animal_b > ratio_animal_a) {
        return 1;
      } else if (ratio_animal_b < ratio_animal_a) {
        return -1;
      } else {
        return 0;
      }
    }
  });
  var animalsIDSorted = animals.map(function(animal) {return animal.ID});
  return animalsIDSorted;
}

const shouldFetchLatestAnimals = (state) => {
//TODO: Add refresh based on time
  if (Object.keys(state.animals.animalStore).length === 0) {
    return true;
  } else {
    return false;
  }
}
const shouldFetchMoreBallots= (state) => {
    if (checkNested(state, "ballots", "ballotStore")) {
      console.log("? FETCH MORE BALLOTS?");
      console.log("WE HAVE " + state.ballots.ballotIDQueue.length);
      console.log(state.ballots.isFetching);
      return (state.ballots.ballotIDQueue.length <= 5 && state.ballots.isFetching === false)
    } else {
      return true;
    }
}

//--Root Reducer--

const rootReducer = Redux.combineReducers({
"animals": animals,
"ballots": ballots,
"authkey": authkey,
"ui": ui
})
//--Store--

function createThunkMiddleware(extraArgument) {
  return function (_ref) {
    var dispatch = _ref.dispatch,
        getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }

        return next(action);
      };
    };
  };
}
// This middleware will just add the property "async dispatch"
// to actions with the "async" property set to true
const asyncDispatchMiddleware = store => next => action => {
  let syncActivityFinished = false;
  let actionQueue = [];

  function flushQueue() {
    actionQueue.forEach(a => store.dispatch(a)); // flush queue
    actionQueue = [];
  }

  function asyncDispatch(asyncAction) {
    actionQueue = actionQueue.concat([asyncAction]);

    if (syncActivityFinished) {
      flushQueue();
    }
  }

  const actionWithAsyncDispatch =
    Object.assign({}, action, { asyncDispatch });

  const res = next(actionWithAsyncDispatch);
  syncActivityFinished = true;
  flushQueue();
  return res;
};

export const store = Redux.createStore(rootReducer, Redux.applyMiddleware(createThunkMiddleware(), asyncDispatchMiddleware));

//--Constants--

const QUEUE_STATE = {
HIDDEN : "hidden",
INCOMING: "incoming",
OUTGOING: "outgoing"
}
