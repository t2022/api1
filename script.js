if ("serviceWorker" in navigator) {
 if (navigator.serviceWorker.controller) {
  console.log("[PWA Builder] active service worker found, no need to register");
 } else {
  navigator.serviceWorker
  .register("pwabuilder-sw.js", {
   scope: "./"
  })
  .then(function(reg) {
   console.log("[PWA Builder] Service worker has been registered for scope: " + reg.scope);
  });
 }
}

var limit = 3000;

function listen(id) {
  var msg = document.getElementById(id).value;
  msg = new SpeechSynthesisUtterance(msg);
  var voicesList = speechSynthesis.getVoices();
  msg.voice = voicesList.find((voice) => voice.lang === 'en-US');
  speechSynthesis.speak(msg);
}

function searchReddit() {
  event.preventDefault();
  document.getElementById("id01").style.display = "none";
  document.getElementById("notice").innerText = "";

  var term = document.getElementById("searchterm").value;
  var user = document.getElementById("username").value.replace(" ","");
  var sub = document.getElementById("subreddit").value.replace(" ","");
  var submission = document.getElementById("submission").checked;


  var n = Date.now();
  if (submission) {
    w3.getHttpObject("https://api.pushshift.io/reddit/submission/search?author=" + user + "&limit=" + limit + "&subreddit=" + sub + "&q=" + term, showAll);
  } else
    w3.getHttpObject("https://api.pushshift.io/reddit/search?author=" + user + "&limit=" + limit + "&subreddit=" + sub + "&q=" + term, showAll);
}

function showAll(myObject) {
  
  
  var myArray = myObject.data;
  for (i = 0; i < myArray.length; i++) {
    var d = new Date(myArray[i]["created_utc"] * 1000);
    myArray[i]["created_utc"] = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ", " + d.getHours() + ":" + d.getMinutes();
    myArray[i]["postId"] = myArray[i]["link_id"] ? myArray[i]["link_id"].replace("t3_", "") : myArray[i]["id"];
    if(myArray[i]["body"]) myArray[i]["bodyLength"] = myArray[i]["body"].length;
  }
  var submission = document.getElementById("submission").checked;
  if (submission) {
    for (i = 0; i < myArray.length; i++) {
      myArray[i]["body"] = myArray[i]["title"] + "\n\n" + myArray[i]["selftext"];
      myArray[i]["bodyLength"] = myArray[i]["body"].length;
      myArray[i]["permalink"] = "/" + myArray[i]["id"];
    }
  }

  // var minLength = parseInt(document.getElementById("min-length").value);
  // if(minLength > 0) {
  //   for (i = 0; i < myArray.length; i++) {
  //     if(myArray[i]["bodyLength"] < minLength) {
  //       console.log(i, minLength, myArray[i]);
  //       myArray.splice(i, 1); 
  //       continue;
  //     }
  //   }
  // }

  myArray = sort2(myArray, "bodyLength", "desc");

  w3.displayObject("id01", myObject);
  
  if(myArray.length > 0) {
   document.getElementById("id01").style.display = "";
  }
  document.getElementById("notice").innerText = myArray.length + " Results Found"
}

function sort2 (arr, key, order = "asc") {
  
  return arr.sort((function(index){
    return function(a, b){
      if(order == "desc") return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
      return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
    };
  })(key))
}

function copyText(id) {
 var txt = document.getElementById(id);

 txt.select();
 txt.setSelectionRange(0, 99999); /* For mobile devices */

 document.execCommand("copy");
}

function showPost(myObject) {
  var myArray = myObject.data[0];

  var title = myArray["title"];
  var body = myArray["selftext"];
  
  body = mdToHtml(body);
  body = readable(body);

  myArray["body"] = body;
  myArray["timeDiff"] = secondsToDhms(UTCTimestamp() - myArray["created_utc"]);

  w3.displayObject("id01", myArray);
}

function showComments(comments) {
  var data = comments.data;

  for (i = 0; i < data.length; i++) {

    data[i]["body"] = mdToHtml(data[i]["body"]);
    data[i]["comment"] = readable(data[i]["body"]);

    data[i]["timeDiff"] = secondsToDhms(UTCTimestamp() - data[i]["created_utc"]);


    data[i]["parent_id"] = data[i]["parent_id"].replace("t3_", "");
    data[i]["parent_id"] = data[i]["parent_id"].replace("t1_", "");
    term = data[i]["id"] + " > " + data[i]["parent_id"];

    // if parent is post, top level
    // else create recursive loop

    if(data[i]["parent_id"] == id) {
      data[i]["level"] = "top";
    } else {
      data[i]["level"] = "child";
    }
  }
  console.log(comments);

  w3.displayObject("comments", comments);  
}

function assignParent(child, parent) {
  var x;
  x[parent] = child;
  return
}

function mdToHtml(text){
  //bold
  var bold = /\*\*(.*?)\*\*/gm;
  var text = text.replace(bold, '<strong>$1</strong>');
  //italics
  var italics = /\*(.*?)\*/gm;
  var text = text.replace(italics, '<em>$1</em>');      
  return text;
}

function readable(text) {
  text = text.replace("\t", " ");

  var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~|])/ig;
  return text.replace(urlRegex, function(url) {
    return '<a href="' + url + '">Link</a>';
  });
  //return text;
}

function UTCTimestamp () {
  var t = new Date();
  var year = t.getUTCFullYear();
  var month = t.getUTCMonth();
  var date = t.getUTCDate();
  var hour = t.getUTCHours();
  var minute = t.getUTCMinutes();
  var second = t.getUTCSeconds();
  
  var utc = Date.UTC(year, month, date, hour, minute, second);
  return utc/1000;
}

function secondsToDhms(seconds) {
  seconds = Number(seconds);
  var y = Math.floor(seconds / (3600*24*365));
  var d = Math.floor(seconds % (3600*24*365) / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);

  var yDisplay = y > 0 ? y + "y " : "";
  var dDisplay = d > 0 ? d + "d " : "";
  var hDisplay = h > 0 ? h + "h " : "";
  var mDisplay = m > 0 ? m + "m " : "";
  var sDisplay = s > 0 ? s + "s" : "";
  return yDisplay + dDisplay + hDisplay + mDisplay + sDisplay;
}
