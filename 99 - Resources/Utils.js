class Utils {

	/**
	 * Goes from spherical coordinates [r,theta,phi] into cartesians [x,y,z]
	 * params theta and phi are in degrees
	 * @return {3-component vector} A vector containing the X, Y and Z coordinates in cartesian form.
	 */
	static SphericalToCartesian(radius, theta, phi) {
		let _theta = glMatrix.toRadian(theta);
		let _phi = glMatrix.toRadian(phi);

		let x = radius * Math.sin(_phi) * Math.cos(_theta);
		let z = radius * Math.sin(_phi) * Math.sin(_theta);
		let y = radius * Math.cos(_phi);
		
		return [x, y, z];
	}

	/**
	 * Returns the passed RGB value in HEX form with a leading #
	 * For example: (r,g,b = 1.0,0,0) -> #ff0000
	 * 
	 * @param  {Float} r red value
	 * @param  {Float} g green value
	 * @param  {Float} b blue value
	 * @return {String} Color in HEX form with # prefix
	 */
	static rgbFloatToHex(r, g, b) {

		let rf = Math.floor(r * 255.0);
		let gf = Math.floor(g * 255.0);
		let bf = Math.floor(b * 255.0);

		return this.rgbIntToHex(rf, gf, bf);
	}

	/**
	 * Returns the passed RGB value in HEX form with a leading #
	 * For example: (r,g,b = 1,0,0) -> #ff0000
	 * 
	 * @param  {Integer} r red value
	 * @param  {Integer} g green value
	 * @param  {Integer} b blue value
	 * @return {String} Color in HEX form with # prefix
	 */
	static rgbIntToHex(r, g, b) {

		let rhex = ("0" + Number(r).toString(16)).slice(-2);
		let ghex = ("0" + Number(g).toString(16)).slice(-2);
		let bhex = ("0" + Number(b).toString(16)).slice(-2);

	    return "#" + rhex + ghex + bhex;
	}

	/**
	 * Returns the passed HEX color value in Integer form
	 * @param  Color written in HEX form.
	 * @return The R G B values in a vector, in integer form in that order.
	 */
	static hexToRgbInt(hex) {
		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		};
	}

	/**
	 * Returns the passed HEX color value in float form
	 * @param  Color written in HEX form.
	 * @return The R G B values in a vector, in float form in that order.
	 */
	static hexToRgbFloat(hex) {
		let rgbInt = this.hexToRgbInt(hex);
		return {
			r: parseFloat(rgbInt.r) / 255.0,
			g: parseFloat(rgbInt.g) / 255.0,
			b: parseFloat(rgbInt.b) / 255.0,
		};
	}

}