String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
        hex = hex = this.charCodeAt(i).toString(16).padStart(2,"0")
        result += hex;
    }

    return result
}

String.prototype.hexDecode = function(){
    var j;
    var hexes = this.match(/.{1,2}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
        const code = parseInt(hexes[j], 16);
        if (code !== 0) {
            back += String.fromCharCode(code);
        }
    }

    return back;
}

// String.prototype.hexEncode = function(){
//     return new TextEncoder().encode(this);
// }
