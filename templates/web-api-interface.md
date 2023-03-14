---
title: <%= iface %>
slug: Web/API/<%= iface %>
page-type: web-api-interface
<% if (experimental) { %>
status:
- experimental
<% } %>
browser-compat: api.<%= iface %>
---
{{APIRef("<%=groupdataname%>")}}
<% if (experimental) { %>
{{SeeCompatTable}}
<% } %>
<% if (securecontext) { %>
{{SecureContext_Header}}
<% } %>
{{Interface_Overview("<%=groupdataname %>")}}

TOWRITE: Summary paragraph

{{InheritanceDiagram}}

<% if (constructor) { %>
## Constructor

- {{DOMxRef("<%= iface %>.<%= iface %>", "<%= iface %>()")}}
  - : Creates a new instance of the {{DOMxRef("<%= iface %>")}} object.
<% } %>
<% if (staticproperties || parentstaticproperties) {%>
## Static properties
<% if (parentstaticproperties) { %>
Also inherits properties from its parent interface, {{DOMxRef("<%= parent %>")}}.
<% } %><% for (let property of staticproperties || []) { %>
- {{DOMxRef("<%= iface %>.<%= property.name %>")}} <% if (property.readonly) { %>{{ReadOnlyInline}}<% } %>
  - <%- property.idltype %>  TOWRITE: Include a brief description of the property and what it does here.
<% } %><% } %>
<% if (properties || parentproperties) {%>
## Instance properties
<% if (parentproperties) { %>
_Also inherits properties from its parent interface, {{DOMxRef("<%= parent%>")}}._
<% } %><% for (let property of properties || []) { %>
- {{DOMxRef("<%= iface %>.<%= property.name %>")}} <% if (property.readonly) { %>{{ReadOnlyInline}}<% } %>
  - <%- property.idltype %> TOWRITE: Include a brief description of the property and what it does here.
<% } %><% } %>
<% if (staticmethods || parentstaticmethods) {%>
## Static methods
<% if (parentstaticmethods) { %>
_Also inherits methods from its parent interface, {{DOMxRef("<%= parent %>")}}.
<% } %><% for (let method of staticmethods || []) { %>
- {{DOMxRef("<%= iface %>.<%= method.name %>()")}}
  - TOWRITE: Include a brief description of the method and what it does here.
<% }%><% }%>
<% if (methods || parentmethods) {%>
## Instance methods
<% if (parentmethods) { %>
_Also inherits methods from its parent interface, {{DOMxRef("<%= parent %>")}}._
<% } %><% for (let method of methods || []) { %>
- {{DOMxRef("<%= iface %>.<%= method.name %>()")}}
  - TOWRITE: Include a brief description of the method and what it does here.
<% }%><% }%>
<% if (events) {%>
## Events

Listen to these events using [`addEventListener()`](/en-US/docs/Web/API/EventTarget/addEventListener) or by assigning an event listener to the `oneventname` property of this interface.
<% for (let event of events) {%>
- {{DOMXref("<%= iface %>.<%= event %>_event", '<%= event %>')}}
  - TOWRITE: Fired when (include the description of when the event fires).
    Also available via the `on<%= event %>` property.
<% } %><% } %>

## Examples

### TOWRITE A descriptive heading

TOWRITE: Each example must have an H3 heading (`###`) naming the example. The heading should be descriptive of what the example is doing. For example, "A simple example" does not say anything about the example and therefore, not a good heading. The heading should be concise. For a longer description, use the paragraph after the heading. See our guide on how to add [code examples](/en-US/docs/MDN/Writing_guidelines/Page_structures/Code_examples) for more information.

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}
