const { Transform } = require('stream');
const logger = require('./logger');

// Define a Transform stream to parse JSON objects line by line
class JSONStream extends Transform {
    constructor(options) {
        super({ ...options, objectMode: true });
        this.buffer = '';
    }

    _transform(chunk, encoding, callback) {
        this.buffer += chunk.toString(); // Append chunk to buffer
        const lines = this.buffer.split('\n'); // Split buffer into lines

        // Process complete lines
        while (lines.length > 1) {
            const line = lines.shift() || ''; // Get the first complete line
            if (line.trim() === '') continue; // Skip empty lines
            try {
                const obj = JSON.parse(line); // Parse JSON object
                logger.debug('data chunk %j', obj);
                this.push(obj); // Push the object to the stream
            } catch (error) {
                this.emit('error', error); // Emit error if JSON parsing fails
            }
        }

        // Save the incomplete line for the next chunk
        this.buffer = lines[0] || '';

        callback(); // Callback to indicate processing is complete
    }

    _flush(callback) {
        // Process any remaining data in the buffer
        if (this.buffer.trim() !== '') {
            try {
                const obj = JSON.parse(this.buffer); // Parse JSON object
                logger.info('buffer %j', obj);
                this.push(obj); // Push the object to the stream
            } catch (error) {
                this.emit('error', error); // Emit error if JSON parsing fails
            }
        }
        callback(); // Callback to indicate processing is complete
    }
}

module.exports = JSONStream;
