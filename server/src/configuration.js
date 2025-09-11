import fs from "node:fs";
/**
 * @typedef {"value"|"configuration"} ConfigType
 */

export class InputConfigOptions {
	element = "input";
	/** @type {string} */
	default = "";

	type = "string";

	/**
	 * @param {string} tp
	 * @param {string} val
	 */
	constructor(tp, val) {
		this.default = val;
		this.type = tp;
	}
}
export class SelectConfigOptions {
	element = "select";

	/** @type {any[]}*/
	options = [];

	/**
	 * @param {any[]} options
	 */
	constructor(options) {
		this.options = options;
	}
}

/**
 * @typedef {InputConfigOptions | SelectConfigOptions} ConfigOptions
 */

/**
 * @template  T
 */
export class ConfigurationValue {
	/** @type {ConfigType} */
	tp = "value";
	/** @type {T} */
	value;
	/** @type {Configuration} */
	parent;
	/**@type {(() => Promise<ConfigOptions>)|null}*/
	getConfig = null;
	/**
	 * @param {T} value
	 * @param {(() => Promise<ConfigOptions>)?} getConfig
	 */
	constructor(value, getConfig) {
		this.value = value;
		this.getConfig = getConfig;
	}

	/**
	 * @param {T} value
	 */
	set(value) {
		this.setQuiet(value);
		this.parent.onUpdate();
	}
	/**
	 * @param {T} value
	 */
	setQuiet(value) {
		this.value = value;
	}

	/**
	 * @param {(() => Promise<ConfigOptions>) | null} fn
	 */
	setConfigGetter(fn) {
		this.getConfig = fn;
	}
}

/**
 * @typedef {ConfigurationValue|Configuration} AnyConfig
 */

/**
 * @template T
 * @typedef {T} ActualObject
 * This typedef is just here bc apparently ts inference only happens inside <>
 */

/**
 * @template T
 * @typedef {ActualObject<{
		[K in keyof T]: 
			T[K] extends AnyConfig ?
				T[K] : (
					ConfigurationValue<T[K]>
				)
		}>} ConfigurationValueType
 */

/**
 * @template T - The type of the desired values
 * A field in T will be end up as a ConfigurationValue in this object if it is
 * either an array type or a standard primitive type
 * A field in T will end up as a PlainConfiguration if it is a regular object
 * A field in T will end up as a Configuration if it is typed as a Configuration object
 */
export class Configuration {
	static #nilRoot = new Configuration({});
	/** @type {ConfigType} */
	tp = "configuration";
	/** @type {string|null} */
	outputFile = null;
	/**
	 * @type {ConfigurationValueType<T>}
	 * */
	value;
	// parent is here so that non root obects can trigger an update request if child
	// values need an update
	/**@type {Configuration?} */
	parent = null;
	/**
	 * @param obj {T}
	 */
	constructor(obj) {
		this._loadFromObject(obj);
	}

	/**
	 * @template {keyof T} K
	 * @param {K} key
	 * @param val {T[K]}
	 */
	_loadFromValue(key, val) {
		if (val instanceof Configuration || val instanceof ConfigurationValue) {
			// @ts-ignore
			this.value[key] = val;
		} else {
			// @ts-ignore
			this.value[key] = new ConfigurationValue(val);
		}
		this.value[key].parent = this;
	}

	/// Loads the plain object into a configuration type
	/**
	 * @param obj {T}
	 */
	_loadFromObject(obj) {
		// @ts-ignore
		this.value = {};
		for (const key in obj) {
			const val = obj[key];
			this._loadFromValue(key, val);
		}
	}
	/**
	 * @return {object}
	 */
	convertToObject() {
		/** @type {any} */
		var ret = {};
		for (const key in this.value) {
			const val = this.value[key];
			if (val.tp === "value") {
				ret[key] = val.value;
			} else if (val.tp === "configuration") {
				// @ts-ignore
				ret[key] = val.convertToObject();
			}
		}
		return ret;
	}
	/**
	 * @param obj {T}
	 */
	set(obj) {
		for (const key in this.value) {
			this.value[key].setQuiet(obj[key]);
		}
		this.onUpdate();
	}
	/**
	 * @param obj {T}
	 */
	setQuiet(obj) {
		for (const key in this.value) {
			this.value[key].setQuiet(obj[key]);
		}
	}

	/**
	 * @template {keyof T} K
	 * @param key {K}
	 * @param obj {T[K] extends Configuration ? T[K] : null}
	 */
	replaceField(key, obj) {
		if (obj === null) {
			return;
		}
		this.value[key].parent = Configuration.#nilRoot;
		// @ts-ignore
		this.value[key] = obj;
		this.value[key].parent = this;
	}

	/**
	 * @template {keyof T} K
	 * @param key {K}
	 * @param obj {T[K]}
	 * This function is just a shorthand for .get(key).set(obj)
	 */
	setField(key, obj) {
		this.value[key].set(obj);
	}

	/**
	 * @template {keyof T} K
	 * @param {K} key
	 * @return {ConfigurationValueType<T>[K]}
	 */
	getConfigurable(key) {
		return this.value[key];
	}

	/**
	 * @template {keyof T} K
	 * @param {K} key
	 * @return {T[K]}
	 */
	get(key) {
		if (this.value[key] instanceof Configuration) {
			// @ts-ignore
			return this.value[key];
		} else {
			return this.value[key].value;
		}
	}

	/**
	 * @param {string} outputFile
	 */
	setRoot(outputFile) {
		this.outputFile = outputFile;
	}
	onUpdate() {
		if (this == Configuration.#nilRoot) {
			return;
		}
		if (this.outputFile !== null) {
			const output = this.convertToObject();
			fs.writeFileSync(this.outputFile, JSON.stringify(output), {});
		} else if (this.parent !== null) {
			this.parent?.onUpdate();
		}
	}

	hasConfigOptions() {
		for (const key in this.value) {
			const val = this.value[key];
			if (val instanceof Configuration) {
				if (val.hasConfigOptions()) {
					return true;
				}
			} else if (val.getConfig) {
				return true;
			}
		}
		return false;
	}

	/// should traverse the tree and find find ALL configurable values,
	/// then transform into a tree that can be sent to the browser
	/**
	 * @return {Promise<object>}
	 */
	async getConfigOptions() {
		/** @type {any} */
		var ret = {};

		/** @type {Promise<void>[]}*/
		var promises = [];

		for (const key in this.value) {
			const val = this.value[key];
			if (val instanceof Configuration) {
				if (val.hasConfigOptions()) {
					const fn = async function () {
						ret[key] = await val.getConfigOptions();
					};
					promises.push(fn());
				}
			} else if (val.getConfig !== null) {
				const fn = async function () {
					// @ts-ignore
					const v = await val.getConfig();
					// @ts-ignore
					if (v.element === "input" && v.default === "") {
						// @ts-ignore
						v.default = val.value;
					} else {
						// @ts-ignore
						const el = v.options.indexOf(val.value);
						if (el !== -1) {
							// @ts-ignore
							v.options.unshift(v.options[el]);
						}
					}
					ret[key] = [v];
				};
				promises.push(fn());
			}
		}
		await Promise.allSettled(promises);
		return ret;
	}

	/**
	 * @param {T} obj - Note that not all fields in obj must be set
	 */
	useConfigOptions(obj) {
		for (const key in obj) {
			const currentVal = this.value[key];
			if (currentVal instanceof Configuration) {
				currentVal.useConfigOptions(obj[key]);
			} else {
				currentVal.set(obj[key]);
			}
		}
	}
}
