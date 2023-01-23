const {downloadZip} = await import("https://cdn.jsdelivr.net/npm/client-zip/index.js");

const fileSep = filename => `--------------------------${filename}\n`;

const parse = WebIDL2.parse;

const [groupData, interfaces, events] = await Promise.all(
  ["https://raw.githubusercontent.com/mdn/content/main/files/jsondata/GroupData.json",
   "https://raw.githubusercontent.com/w3c/webref/curated/ed/idlnames.json",
   "https://w3c.github.io/webref/ed/events.json"
  ].map(url => fetch(url).then(r => r.json() )));


const groupDataSelector = document.getElementById("api");
Object.keys(groupData[0]).forEach(name => {
  const option = document.createElement("option");
  option.textContent = name;
  groupDataSelector.append(option);
});
const interfaceSelector = document.getElementById("interface");
Object.keys(interfaces).forEach(name => {
  const option = document.createElement("option");
  option.textContent = name;
  interfaceSelector.append(option);
});

const _idlCache = {};

async function getIdl(name) {
  if (!_idlCache[name]) {
    const idlUrl = `https://w3c.github.io/webref/ed/idlnamesparsed/${name}.json`;
    try {
      const idlData = await fetch(idlUrl).then(r => r.json());
      _idlCache[name] = idlData;
    } catch (e) {
      const err = new Error(`Failed to parse data from ${idlUrl}`);
      err.cause = e;
      throw err;
    }
  }
  return _idlCache[name];
}

function getParsedIdl(idlData) {
  return parse(idlData.defined.fragment + idlData.extended.map(e => e.fragment).join("\n") + idlData.includes.map(e => e.defined.fragment).join("\n"));
}

const isStatic = m => m.special === "static";
const not = f => m => !f(m);
const isEventHandler = m => m.type === "attribute" && m.name.startsWith("on") && m.idlType?.idlType === "EventHandler";
const isAttribute = m => m.type === "attribute";
const isConstructor = m => m.type === "constructor";
const isOperation = m => m.type === "operation";
const hasName = name => m => m.name === name;
const hasSecureContextExtAttr = ea => ea.name === "SecureContext";
const byName = (a, b) => a.name.localeCompare(b.name, "en-US");

function formatIdlType(idlType) {
  // TODO: deal with complexity of idlType
  return typeof idlType === "string" ? idlType : idlType.idlType;
}

function getMembers(idls, predicates = [x => true]) {
  predicates = Array.isArray(predicates) ? predicates : [predicates];
  const members = idls.filter(i => i.members).map(i => i.members.filter((m, i, arr) => predicates.every(
    f => f(m) &&
      // remove dups due to overloaded operations
    arr.findIndex(mm => m.type === "constructor" ? mm.type === m.type : mm.name === m.name) === i)
								       ))
	.flat();
  if (members.length === 0) return null;
  return members;
}

// Web API
// can experimental be calculated based on BCD?
async function generateInterfacePage(iface, groupdataname, options = {experimental: false, recursive: false}) {
  const ifaceData = {
    iface,
    experimental: options.experimental,
    groupdataname
  };

  const idlData = await getIdl(iface);
  const parsedIdl = getParsedIdl(idlData);

  const mainIdl = parsedIdl[0];
  ifaceData.securecontext = mainIdl.extAttrs.find(hasSecureContextExtAttr);
  ifaceData._constructor = mainIdl.members.find(isConstructor);

  ifaceData.staticproperties = getMembers(parsedIdl, [isAttribute, isStatic])?.sort(byName);
  ifaceData.properties = getMembers(parsedIdl, [isAttribute, not(isStatic), not(isEventHandler)])?.sort(byName);
  ifaceData.staticmethods = getMembers(parsedIdl, [isOperation, isStatic])?.sort(byName);
  ifaceData.methods = getMembers(parsedIdl, [isOperation, not(isStatic)])?.sort(byName);

  ifaceData.events = getMembers(parsedIdl, isEventHandler)?.map(m => m.name.slice(2))?.sort();

  if (!mainIdl.inheritance) {
    ifaceData.parent = null;
    ifaceData.parentstaticproperties = null;
    ifaceData.parentproperties = null;
    ifaceData.parentstaticmethods = null;
    ifaceData.parentmethods = null;
  } else {
    const parent = idlData.inheritance;
    ifaceData.parent = parent.name;
    const parentIdl = parse(parent.defined.fragment);
    ifaceData.parentstaticproperties = getMembers(parentIdl, [isAttribute, isStatic]);
    ifaceData.parentproperties = getMembers(parentIdl, [isAttribute, not(isStatic), not(isEventHandler)]);
    ifaceData.parentstaticmethods = getMembers(parentIdl, [isOperation, isStatic]);
    ifaceData.parentmethods = getMembers(parentIdl, [isOperation, not(isStatic)]);
  }
  const tmpl = await fetch("templates/web-api-interface.md").then(r => r.text());
  let ret = [
    {
      name: "index.md",
      input: ejs.render(tmpl, ifaceData)
    }
  ];
  if (options.recursive) {
    const path = p => `${p.toLowerCase()}/index.md`;
    async function generateSubPages(entries, staticMember)  {
      return Promise.all((entries || []).map(async p => {
	let subpage = {name: path(p.name)};
	try {
	  subpage.input = await generateSubInterfacePage(iface, p.name, staticMember, groupdataname, options);
	} catch (e) {
	  subpage.input += `Error: ${e}`;
	}
	return subpage;
      }
					    ));
    }

    if (ifaceData._constructor) {
      ret.push({name: path(iface), input: await generateSubInterfacePage(iface, "constructor", false, groupdataname, options)});
    }
    ret = ret.concat(await generateSubPages(ifaceData.staticproperties, true));
    ret = ret.concat(await generateSubPages(ifaceData.properties, false));
    ret = ret.concat(await generateSubPages(ifaceData.staticmethods, true));
    ret = ret.concat(await generateSubPages(ifaceData.methods, false));
    ret = ret.concat(await Promise.all((ifaceData.events || []).map(async name => {
      let subpage = {name: path(name + "_event")};
      try {
	subpage.input = await generateEventInterfacePage(iface, name, groupdataname, options);
      } catch (e) {
	subpage.input = `Error: ${e}`;
      }
      return subpage;
    }
								   )));
  }
  return ret;
}

const idlType2PageType = {
  "constructor": "method",
  "operation": "method",
  "attribute": "property"
};

async function generateEventInterfacePage(iface, eventname, groupdataname, options = {experimental: false}) {
  const eventData = {
    iface,
    eventname,
    experimental: options.experimental,
    groupdataname
  };
  const idlData = await getIdl(iface);
  const parsedIdl = getParsedIdl(idlData);
  const matchingMembers = getMembers(parsedIdl, [isEventHandler, hasName("on" + eventname)]);
  if (!matchingMembers) {
    throw new Error(`Unknown event ${eventname} for ${iface}`);
  }
  const member = matchingMembers[0];

  eventData.securecontext = parsedIdl[0].extAttrs.find(hasSecureContextExtAttr) || member.extAttrs.find(hasSecureContextExtAttr);

  eventData.eventinterface = "TBD";
  eventData.parenteventinterface = "TBD";
  eventData.eventproperties = [];

  const event = events.find(e => e.type === eventname && e.targets.find(i => i.target === iface));

  if (event) {
    eventData.eventinterface = event.interface;
    if (event.interface === "Event") {
      eventData.parenteventinterface = null;
    } else {
      const eventIdlData = await getIdl(event.interface);
      const parsedEventIdl = getParsedIdl(eventIdlData);
      eventData.parenteventinterface = parsedEventIdl[0].inheritance?.name;
      const eventproperties = getMembers(parsedEventIdl, isAttribute)?.sort(byName);
      if (eventproperties) {
	eventData.eventproperties = eventproperties.map(m => { return {name: m.name, type: formatIdlType(m.idlType)}; });
      }
    }
  }
  const tmpl = await fetch(`templates/web-api-event.md`).then(r => r.text());
  return ejs.render(tmpl, eventData);

}

async function generateSubInterfacePage(iface, membername, staticMember, groupdataname, options = {experimental: false}) {
  const memberData = {
    iface,
    membername,
    experimental: options.experimental,
    groupdataname,
    static: staticMember,
    _constructor: false,
    returnvalue: null
  };
  if (membername === "constructor") {
    memberData._constructor = true;
    memberData.membername = iface;
  }
  const idlData = await getIdl(iface);
  const parsedIdl = getParsedIdl(idlData);
  const matchingMembers = memberData._constructor ? getMembers(parsedIdl, isConstructor) : getMembers(parsedIdl, [staticMember? isStatic : not(isStatic), hasName(membername)]);
  if (!matchingMembers) {
    throw new Error(`Unknown ${iface}.${membername}`);
  }
  const member = matchingMembers[0];
  memberData.securecontext = parsedIdl[0].extAttrs.find(hasSecureContextExtAttr) || member.extAttrs.find(hasSecureContextExtAttr);

  if (isConstructor(member) || isOperation(member)) {
    memberData.parameters = member.arguments.map(a => { return {name: a.name, type: formatIdlType(a.idlType), optional: a.optional} ; });
    memberData.parameters = memberData.parameters.length ? memberData.parameters : null;
  }
  if (isOperation(member)) {
    memberData.returnvalue = member.idlType !== "undefined" ? formatIdlType(member.idlType) : null;
  }
  const tmpl = await fetch(`templates/web-api-${idlType2PageType[member.type]}.md`).then(r => r.text());
  return ejs.render(tmpl, memberData);
}

function optgroup(label, items) {
  const el = document.createElement("optgroup");
  el.label = label;
  for (let item of items) {
    const opt = document.createElement("option");
    opt.value = item.value;
    opt.textContent = item.label;
    el.append(opt);
  }
  return el;
}

document.getElementById("member").addEventListener("change", async function(e) {
  if (e.target.value) {
    document.getElementById("sub").disabled = true;
    document.getElementById("sub").checked = false;
    document.querySelector('[for="sub"]').classList.add("disabled");
  } else {
    document.getElementById("sub").disabled = false;
    document.querySelector('[for="sub"]').classList.remove("disabled");
  }
});

document.getElementById("interface").addEventListener("change", async function(e) {
  if (e.target.value) {
    const ifaceName = e.target.value;
    const memberSelector = document.getElementById("member");
    const apiSelector = document.getElementById("api");
    // reset
    memberSelector.innerHTML = `<option value="">Interface page</option>`;
    document.getElementById("sub").disabled = false;
    document.querySelector('[for="sub"]').classList.remove("disabled");
    document.getElementById("output").textContent = "";
    document.getElementById("generate").disabled = false;

    (apiSelector.querySelector("option[selected]") || {}).selected = false;
    const idlData = await getIdl(ifaceName);
    const parsedIdl = getParsedIdl(idlData);
    // bail out if this is not a documentable item
    if (parsedIdl[0].type !== "interface") {
      document.getElementById("generate").disabled = true;
      document.getElementById("download").disabled = true;
      document.getElementById("output").textContent = "Not an interface";
    }
    const attributeOptions = optgroup("Properties",
				      (getMembers(parsedIdl, [isAttribute, (m => m.name)]) || []).map(m => { return { value: `attribute|${m.name}`, label: m.name};}).sort());
    const constructorOptions = optgroup("Constructor",
					(getMembers(parsedIdl, isConstructor) || []).map(m => { return { value: `constructor|constructor`, label: `${ifaceName}() (constructor)`};}).sort());
    const methodOptions = optgroup("Methods",
				   (getMembers(parsedIdl, [isOperation, (m => m.name)]) || []).map(m => { return { value: `operation|${m.name}${m.special === "static" ? "|static" : ""}`, label: `${m.name}()${m.special === "static" ? " - static" : ""}`};}).sort());
    const eventOptions = optgroup("Events",
				  (getMembers(parsedIdl, isEventHandler) || []).map(m => { return { value: `event|${m.name.slice(2)}`, label: `${m.name.slice(2)} event`};}).sort());

    memberSelector.append(attributeOptions, constructorOptions, methodOptions, eventOptions);

    const groupName =  Object.keys(groupData[0]).find(api => groupData[0][api].interfaces?.includes(ifaceName));
    if (groupName) {
      [...apiSelector.querySelectorAll("option")].find(o => o.textContent === groupName).selected = true;
    } else {
      apiSelector.querySelector("option").selected = true;
    }
  }
});

let generatedFiles;

document.getElementById("generate").addEventListener("click", async function(e) {
  e.preventDefault();
  document.getElementById("download").disabled = true;
  try {
    if (!document.getElementById("member").value) {
      generatedFiles = await generateInterfacePage(
	document.getElementById("interface").value,
	document.getElementById("api").value,
	{experimental: document.getElementById("experimental").checked, recursive: document.getElementById("sub").checked}
      );
      document.getElementById("output").textContent = generatedFiles.map(page => fileSep(page.name) + page.input).join("\n");
      document.getElementById("download").disabled = false;
    } else {
      const [membertype, membername, staticmember] = document.getElementById("member").value.split("|");
      let ret = "";
      if (membertype === "event") {
	ret = await generateEventInterfacePage(
	  document.getElementById("interface").value,
	  membername,
	  document.getElementById("api").value,
	  {experimental: document.getElementById("experimental").checked}
	)
      } else {
	ret = await generateSubInterfacePage(
	  document.getElementById("interface").value,
	  membername,
	  !!staticmember,
	  document.getElementById("api").value,
	  {experimental: document.getElementById("experimental").checked}
	);
      }
      generatedFiles = [{name: "index.md", input: ret}];
      document.getElementById("download").disabled = false;
      document.getElementById("output").textContent = ret;
    }
  } catch (e) {
    document.getElementById("output").textContent = e.message;
    console.error(e);
  }
});

document.getElementById("download").addEventListener("click", async function(e) {
  e.preventDefault();
  if (!generatedFiles?.length) {
    e.target.disabled = true;
    return;
  }
  let blob, filename;
  if (generatedFiles.length === 1) {
    filename = generatedFiles[0].name;
    blob = new Blob([generatedFiles[0].input], { type: "text/plain"});
  } else {
    // Zip
    blob = await downloadZip(generatedFiles).blob();
    filename = document.getElementById("interface").value + ".zip";
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  link.remove();
});
