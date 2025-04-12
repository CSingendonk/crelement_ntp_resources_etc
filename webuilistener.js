// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import{assert}from"chrome://resources/js/assert.js";import{addWebUiListener,sendWithPromise}from"chrome://resources/js/cr.js";import{getRequiredElement}from"chrome://resources/js/util.js";import{html,render}from"chrome://resources/lit/v3_0/lit.rollup.js";function getVersionHtml(version,partitionId){return html`
    <div class="serviceworker-version">
      <div class="serviceworker-status">
        <span>Installation Status:</span>
        <span class="value">${version.status}</span>
      </div>
      <div class="serviceworker-running-status">
        <span>Running Status:</span>
        <span class="value">${version.running_status}</span>
      </div>
      <div class="serviceworker-fetch-handler-existence">
        <span>Fetch handler existence:</span>
        <span>${version.fetch_handler_existence}</span>
      </div>
      <div class="serviceworker-fetch-handler-type">
        <span>Fetch handler type:</span>
        <span>${version.fetch_handler_type}</span>
      </div>
      ${version.router_rules?html`
        <div class="serviceworker-router-rules">
          <span>Static router rules:</span>
          <span>${version.router_rules}</span>
        </div>
      `:""}
      <div class="serviceworker-script_url">
        <span>Script:</span>
        <span>${version.script_url}</span>
      </div>
      <div class="serviceworker-vid">
        <span>Version ID:</span>
        <span class="value">${version.version_id}</span>
      </div>
      <div class="serviceworker-pid">
        <span>Renderer process ID:</span>
        <span class="value">${version.process_id}</span>
      </div>
      <div class="serviceworker-tid">
        <span>Renderer thread ID:</span>
        <span>${version.thread_id}</span>
      </div>
      <div class="serviceworker-rid">
        <span>DevTools agent route ID:</span>
        <span>${version.devtools_agent_route_id}</span>
      </div>
      ${version.clients.map((item=>html`
        <div class="serviceworker-clients">
          <div>Client: </div>
          <div class="serviceworker-client">
            <div>ID: ${item.client_id}</div>
            <div>URL: ${item.url}</div>
          </div>
        </div>
      `))}
      <div>
        <div>Log:</div>
        <textarea class="serviceworker-log" rows="3" cols="120" readonly
            .value="${getLogsForversion(partitionId,version)}"></textarea>
      </div>
      <div class="worker-controls">
        ${version.running_status==="RUNNING"?html`
          <button data-command="stop"
              @click="${onButtonClick.bind(null,{partition_id:partitionId,version_id:version.version_id})}">
            Stop
          </button>
          <button data-command="inspect"
              @click="${onButtonClick.bind(null,{process_host_id:version.process_host_id,devtools_agent_route_id:version.devtools_agent_route_id})}">
            Inspect
          </button>
        `:""}
      </div>
    </div>`}function getRegistrationHtml(registration,partitionId){return html`
    <div class="serviceworker-registration"
        data-registration-id="${registration.registration_id}">
      <div class="serviceworker-scope">
        <span>Scope:</span>
        <span class="value">${registration.scope}</span>
      </div>
      <!-- Storage Partitioning -->
      ${registration.third_party_storage_partitioning_enabled?html`
        <div class="serviceworker-storage-key-wrapper">
          Storage key:
          <div class="serviceworker-storage-key">
            <div class="serviceworker-origin">
              <span>Origin:</span>
              <span class="value">${registration.origin}</span>
            </div>
            <div class="serviceworker-top-level-site">
              <span>Top level site:</span>
              <span class="value">${registration.top_level_site}</span>
            </div>
            <div class="serviceworker-ancestor-chain-bit">
              <span>Ancestor chain bit:</span>
              <span class="value">${registration.ancestor_chain_bit}</span>
            </div>
            ${registration.nonce!=="<null>"?html`
              <div class="serviceworker-nonce">
                <span>Nonce:</span>
                <span>${registration.nonce}</span>
              </div>
            `:""}
          </div>
        </div>
      `:""}
      <!-- Storage Partitioning ends -->
      <div class="serviceworker-rid">
        <span>Registration ID:</span>
        <span>${registration.registration_id}</span>
        <span ?hidden="${!registration.unregistered}">(unregistered)</span>
      </div>
      <div class="serviceworker-navigation-preload-enabled">
        <span>Navigation preload enabled:</span>
        <span>${registration.navigation_preload_enabled}</span>
      </div>
      <div class="serviceworker-navigation-preload-header-length">
        <span>Navigation preload header length:</span>
        <span>${registration.navigation_preload_header_length}</span>
      </div>

      ${registration.active?html`
        <div>
          Active worker:
          ${getVersionHtml(registration.active,partitionId)}
        </div>
      `:""}

      ${registration.waiting?html`
        <div>
          Waiting worker:
          ${getVersionHtml(registration.waiting,partitionId)}
        </div>
      `:""}

      ${!registration.unregistered?html`
        <div class="registration-controls">
          <button data-command="unregister"
              @click="${onButtonClick.bind(null,{partition_id:partitionId,scope:registration.scope,storage_key:registration.storage_key})}">
            Unregister
          </button>
          ${registration.active?.running_status!=="RUNNING"?html`
            <button data-command="start"
                @click="${onButtonClick.bind(null,{partition_id:partitionId,scope:registration.scope,storage_key:registration.storage_key})}">
              Start
            </button>
          `:""}
        </div>
      `:""}
    </div>`}function getServiceWorkerListHtml(data){if(data.storedRegistrations.length+data.unregisteredRegistrations.length+data.unregisteredVersions.length===0){return html``}return html`
    <div class="serviceworker-summary">
      <span>
        ${data.partitionPath!==""?html`
          <span>Registrations in: </span>
          <span>${data.partitionPath}</span>
        `:html`
          <span>Registrations: Incognito </span>
        `}
      </span>
      <span>(${data.storedRegistrations.length})</span>
    </div>
    ${data.storedRegistrations.map((item=>html`
      <div class="serviceworker-item">
        ${getRegistrationHtml(item,data.partitionId)}
      </div>
    `))}
    ${data.unregisteredRegistrations.map((item=>html`
      <div class="serviceworker-item">
        ${getRegistrationHtml(item,data.partitionId)}
      </div>
    `))}
    ${data.unregisteredVersions.map((item=>html`
      <div class="serviceworker-item">
        Unregistered worker:
        ${getVersionHtml(item,data.partitionId)}
      </div>
    `))}`}function getServiceWorkerOptionsHtml(options){return html`
    <div class="checkbox">
      <label>
        <input type="checkbox" ?checked="${options.debug_on_start}"
            @change="${onDebugOnStartChange}">
          <span>
            Open DevTools window and pause JavaScript execution on Service Worker startup for debugging.
          </span>
      </label>
    </div>
  </div>`}function onDebugOnStartChange(e){const input=e.target;chrome.send("SetOption",["debug_on_start",input.checked])}function onOptions(options){render(getServiceWorkerOptionsHtml(options),getRequiredElement("serviceworker-options"))}async function onButtonClick(cmdArgs,e){const command=e.target.dataset["command"];assert(command);assert(COMMANDS.includes(command));await sendWithPromise(command,cmdArgs);update()}function getLogsForversion(partitionId,version){const logMessages=allLogMessages.get(partitionId)||null;if(logMessages===null){return""}return logMessages.get(version.version_id)||""}function addLogForversion(partitionId,versionId,message){let logMessages=allLogMessages.get(partitionId)||null;if(logMessages===null){logMessages=new Map;allLogMessages.set(partitionId,logMessages)}const previous=logMessages.get(versionId)||"";logMessages.set(versionId,previous+message)}function getUnregisteredWorkers(storedRegistrations,liveRegistrations,liveVersions,unregisteredRegistrations,unregisteredVersions){const registrationIdSet=new Set;const versionIdSet=new Set;storedRegistrations.forEach((function(registration){registrationIdSet.add(registration.registration_id)}));[storedRegistrations,liveRegistrations].forEach((function(registrations){registrations.forEach((function(registration){[registration.active,registration.waiting].forEach((function(version){if(version){versionIdSet.add(version.version_id)}}))}))}));liveRegistrations.forEach((function(registration){if(!registrationIdSet.has(registration.registration_id)){registration.unregistered=true;unregisteredRegistrations.push(registration)}}));liveVersions.forEach((function(version){if(!versionIdSet.has(version.version_id)){unregisteredVersions.push(version)}}))}function onPartitionData(registrations,partitionId,partitionPath){partitionsData.set(partitionId,{registrations:registrations,partitionPath:partitionPath});renderPartitionData(partitionId)}function renderPartitionData(partitionId){const entry=partitionsData.get(partitionId)||null;assert(entry);const unregisteredRegistrations=[];const unregisteredVersions=[];getUnregisteredWorkers(entry.registrations.storedRegistrations,entry.registrations.liveRegistrations,entry.registrations.liveVersions,unregisteredRegistrations,unregisteredVersions);const container=getRequiredElement("serviceworker-list");let partitionDiv=container.querySelector(`[data-partition-id='${partitionId}']`);if(partitionDiv===null){partitionDiv=document.createElement("div");partitionDiv.dataset["partitionId"]=String(partitionId);container.appendChild(partitionDiv)}assert(partitionDiv);render(getServiceWorkerListHtml({storedRegistrations:entry.registrations.storedRegistrations,unregisteredRegistrations:unregisteredRegistrations,unregisteredVersions:unregisteredVersions,partitionId:partitionId,partitionPath:entry.partitionPath}),partitionDiv)}function onErrorReported(partitionId,versionId,errorInfo){addLogForversion(partitionId,versionId,"Error: "+JSON.stringify(errorInfo)+"\n");renderPartitionData(partitionId)}function onConsoleMessageReported(partitionId,versionId,message){addLogForversion(partitionId,versionId,"Console: "+JSON.stringify(message)+"\n");renderPartitionData(partitionId)}const COMMANDS=["stop","inspect","unregister","start"];const allLogMessages=new Map;const partitionsData=new Map;function initialize(){addWebUiListener("partition-data",onPartitionData);addWebUiListener("running-state-changed",update);addWebUiListener("error-reported",onErrorReported);addWebUiListener("console-message-reported",onConsoleMessageReported);addWebUiListener("version-state-changed",update);addWebUiListener("version-router-rules-changed",update);addWebUiListener("registration-completed",update);addWebUiListener("registration-deleted",update);update()}function update(){sendWithPromise("GetOptions").then(onOptions);chrome.send("getAllRegistrations")}document.addEventListener("DOMContentLoaded",initialize);
