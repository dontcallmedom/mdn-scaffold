---
title: "<%= iface %>: <%= eventname %> event"
slug: Web/API/<%= iface %>/<%= eventname %>_event
page-type: web-api-event
<% if (experimental) { %>
tags:
- experimental
<% } %>
browser-compat: api.<%= iface %>.<%= eventname %>_event
---
{{APIRef("<%=groupdataname%>")}}
<% if (experimental) { %>
{{SeeCompatTable}}
<% } %>
<% if (securecontext) { %>
{{SecureContext_Header}}
<% } %>

TOWRITE: The **`<%= eventname %>`** event is sent to the `on<%= eventname %>` event handler on an {{domxref("<%= iface %>")}} object…

## Syntax

Use the event name in methods like {{domxref("EventTarget.addEventListener", "addEventListener()")}}, or set an event handler property.

```js
addEventListener("<%= eventname %>", (event) => {});

on<%= eventname %> = (event) => {};
```

## Event type

<% if (eventinterface === "Event") {%>
A generic {{domxref("Event")}}.
<% } else { %>
A {{domxref("<%= eventinterface %>")}}. Inherits from {{domxref("<%= parenteventinterface %>")}}

{{InheritanceDiagram("<%= eventinterface %>")}}

<% } %>

<% if (eventinterface !== "Event") {%>
## Event properties

In addition to the properties listed below, properties from the parent interface, {{domxref("Event")}}, are available.
<% for (let prop of eventproperties) { %>
- {{domxref("<%= eventinterface%>.<%=prop.name%>", "<%= prop.name%>")}} {{ReadOnlyInline}}
  - : The <%- prop.type %> to which the event refers.
<% } %><% } %>

## Description

OPTIONAL

### Trigger

OPTIONAL

### Use cases

OPTIONAL

## Examples

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

