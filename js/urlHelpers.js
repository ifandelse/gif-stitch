define(function(){

    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 1024;

        function charCodeFromCharacter(c) {
            return c.charCodeAt(0);
        }

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = Array.prototype.map.call(slice, charCodeFromCharacter);
            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

    return {
        toRawData: function (data) {
            return $.base64.encode(data);
        },

        toData: function (data) {
            return 'data:image/gif;base64,' + data;
        },

        toBinary: function (data) {
            window.URL = window.URL || window.webkitURL;
            var blob = b64toBlob(this.toRawData(data), 'image/gif');
            return window.URL.createObjectURL(blob);
        }
    };
});