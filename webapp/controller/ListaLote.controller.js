sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./ValueHelpNf", "./PopoverSefaz",
	"./utilities",
	"sap/ui/core/routing/History"
], function (BaseController, MessageBox, ValueHelpNf, PopoverSefaz, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.nfChannel.controller.ListaLote", {
		/* ************** Eventos  ************** */
		onSearch: function (oEvent) {
			var aListFilterSts = [];
			var aListFilterEmp = [];
			var aListFilterNFe = [];
			var aListFilter = []; //filtro geral

			//Filtro por status
			var aListaStatusID = this.getView().byId("fi_Status").getControl().getSelectedKeys();
			for (var i = 0; i < aListaStatusID.length; i++) {
				aListFilterSts.push(
					new sap.ui.model.Filter("StatusLote/ID", sap.ui.model.FilterOperator.EQ, aListaStatusID[i])
				);
			}
			if (aListFilterSts.length > 0) {
				//repassa o filtro de status para o filtro geral
				var oFilterSts = new sap.ui.model.Filter({
					filters: aListFilterSts,
					and: false
				});

				aListFilter.push(oFilterSts);
			}

			//Filtro por data de envio
			var oDtEnvio = this.getView().byId("fi_DtEnvio").getControl();
			var vDtEnvioFrom = oDtEnvio.getDateValue();
			var vDtEnvioTo = oDtEnvio.getSecondDateValue();

			if (vDtEnvioFrom) {
				
				vDtEnvioFrom.setHours("00","00","00");
				if (vDtEnvioTo === null) {
					vDtEnvioTo = new Date(vDtEnvioFrom.getTime());
				}
				vDtEnvioTo.setHours("23","59","59");

				aListFilter.push(
					new sap.ui.model.Filter("dataEnvio", sap.ui.model.FilterOperator.BT,
						vDtEnvioFrom,
						vDtEnvioTo
					)
				);

			}
			
			//Filtro por empresa
			var aListaEmpresaID = this.getView().byId("fi_Empresa").getControl().getSelectedKeys();
			for (i = 0; i < aListaEmpresaID.length; i++) {
				aListFilterEmp.push(
					new sap.ui.model.Filter("ListaNotaFiscal/Empresa/ID", sap.ui.model.FilterOperator.EQ, aListaEmpresaID[i])
				);
			}
			if (aListFilterEmp.length > 0) {
				//repassa o filtro de empresa para o filtro geral
				var oFilterEmp = new sap.ui.model.Filter({
					filters: aListFilterEmp,
					and: false
				});

				aListFilter.push(oFilterEmp);
			}
			
			//Filtro por NF-e
			var aTokensNFe = this.getView().byId("fi_NfeNum").getControl().getTokens();
			for (i = 0; i < aTokensNFe.length; i++) {
				aListFilterNFe.push(
					new sap.ui.model.Filter("ListaNotaFiscal/nfeNum", sap.ui.model.FilterOperator.EQ, aTokensNFe[i].getKey())
				);
			}
			if (aListFilterNFe.length > 0) {
				//repassa o filtro de empresa para o filtro geral
				var oFilterNFe = new sap.ui.model.Filter({
					filters: aListFilterNFe,
					and: false
				});

				aListFilter.push(oFilterNFe);
			}
			
			var oTableLote = this.getView().byId("tb_Lote");
			var oBinding = oTableLote.getBinding("items");
			//Caso tenha filtros
			if (aListFilter.length > 0) {
				var filter = new sap.ui.model.Filter({
					filters: aListFilter,
					and: true
				});

				//	oTableLote.setBusy(true);
				oBinding.filter(filter);
	
				//if (oTableLote.isBusy() === true) {
				//		oTableLote.setBusy(false);
				//}
				//oTableLote.getModel().refresh(true);
			} else {
				oBinding.filter([]);
				oTableLote.getModel().refresh(true);
			}

		},
		onDateRangeSelectionChange: function (oEvent) {

			var oDateRangeSelection = oEvent.getSource();
			var oBindingContext = oDateRangeSelection.getBindingContext();
			var sBindingPathOfDateValue = oDateRangeSelection.getBindingPath("dateValue");
			var sBindingPathOfSecondDateValue = oDateRangeSelection.getBindingPath("secondDateValue");
			var oFrom = oEvent.getParameter("from");
			if (oBindingContext && sBindingPathOfDateValue && oFrom) {
				var oFromBefore = oBindingContext.getModel().getProperty(sBindingPathOfDateValue, oBindingContext);
				if (oFromBefore) {
					var oUTCFrom = new Date(Date.UTC(oFrom.getFullYear(), oFrom.getMonth(), oFrom.getDate(), oFromBefore.getUTCHours(), oFromBefore.getUTCMinutes(),
						oFromBefore.getUTCSeconds()));
					oBindingContext.getModel().setProperty(sBindingPathOfDateValue, oUTCFrom, oBindingContext);
				}
			}
			var oTo = oEvent.getParameter("to");
			if (oBindingContext && sBindingPathOfSecondDateValue && oTo) {
				var oToBefore = oBindingContext.getModel().getProperty(sBindingPathOfSecondDateValue, oBindingContext);
				if (oToBefore) {
					var oUTCTo = new Date(Date.UTC(oTo.getFullYear(), oTo.getMonth(), oTo.getDate(), oToBefore.getUTCHours(), oToBefore.getUTCMinutes(),
						oToBefore.getUTCSeconds()));
					oBindingContext.getModel().setProperty(sBindingPathOfSecondDateValue, oUTCTo, oBindingContext);
				}
			}

			var bValid = oEvent.getParameter("valid");
			if (bValid) {
				oDateRangeSelection.setValueState(sap.ui.core.ValueState.None);
			} else {
				oDateRangeSelection.setValueState(sap.ui.core.ValueState.Error);
			}

			this.onChangeInputFilter(event);

		},
		onMultiInputValueHelpRequestNF: function () {

			var sDialogName = "ValueHelpNf";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];

			if (!oDialog) {
				oDialog = new ValueHelpNf(this.getView());
				this.mDialogs[sDialogName] = oDialog;

				// For navigation.
				oDialog.setRouter(this.oRouter);
			}
			oDialog.open();

		},
		onPressItemTbLote: function (oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();

			return new Promise(function (fnResolve) {
				this.doNavigate("DetailLote", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onUpdateFinishedTbLote: function (oEvent) {
			var oTable = oEvent.getSource();
			var oHeaderbar = oTable.getAggregation("headerToolbar");
			if (oHeaderbar && oHeaderbar.getAggregation("content")[1]) {
				var oTitle = oHeaderbar.getAggregation("content")[1];
				if (oTable.getBinding("items") && oTable.getBinding("items").isLengthFinal()) {
					oTitle.setText("(" + oTable.getBinding("items").getLength() + ")");
				} else {
					oTitle.setText("(1)");
				}
			}

		},
		onPressReenviar: function () {
			//#TODO

		},
		onPressAtualizarLista: function (oEvent) {
			this.onSearch(oEvent);

		},
		onPressColUF: function (oEvent) {

			var sPopoverName = "PopoverSefaz";
			this.mPopovers = this.mPopovers || {};
			var oPopover = this.mPopovers[sPopoverName];

			if (!oPopover) {
				oPopover = new PopoverSefaz(this.getView());
				this.mPopovers[sPopoverName] = oPopover;

				oPopover.getControl().setPlacement("Auto");

				// For navigation.
				oPopover.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oPopover.open(oSource);

		},
		onChangeInputFilter: function (oEvent) {
			this.oFilterBar.fireFilterChange(oEvent);
		},
		onClear: function (oEvent) {
			var oItems = this.oFilterBar.getAllFilterItems(true);
			for (var i = 0; i < oItems.length; i++) {
				var oControl = this.oFilterBar.determineControlByFilterItem(oItems[i]);
				if (oControl) {
					//oControl.setValue("");

					var sType = oControl.getMetadata().getName();
					switch (sType) {
					case "sap.m.MultiComboBox":
						oControl.setSelectedItems([]);
						break;
					case "sap.m.MultiInput":
						oControl.destroyTokens();

						break;
					default:
						oControl.setValue('');
					}
				}
			}
		},
		onReset: function (oEvent) {
			this.onClear(oEvent);
		},
		/* ************** Manipuladores  ************** */
		handleRouteMatched: function (oEvent) {
			//var oParams = {};

			/*if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function (oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype") {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}*/

			/*			var oPath;

						if (this.sContext) {
							oPath = {
								path: "/" + this.sContext,
								parameters: oParams
							};
							this.getView().bindObject(oPath);
						}*/

		},
		handleFetchData: function () {

			var sGroupName = null;
			var oJsonParam = null;
			var oJsonData = [];

			var oItems = this.getAllFilterItems(true);
			for (var i = 0; i < oItems.length; i++) {
				oJsonParam = {};
				sGroupName = null;
				if (oItems[i].getGroupName) {
					sGroupName = oItems[i].getGroupName();
					oJsonParam.group_name = sGroupName;
				}

				oJsonParam.name = oItems[i].getName();

				var oControl = this.determineControlByFilterItem(oItems[i]);
				if (oControl) {
					//oJsonParam.value = oControl.getValue();
					var sType = oControl.getMetadata().getName();
					switch (sType) {
					case "sap.m.MultiComboBox":
						oJsonParam.value = oControl.getSelectedKeys();
						break;
					case "sap.m.MultiInput":
						var oTokenVal = {};
						oJsonParam.value = [];

						var oListToken = oControl.getTokens();

						//add cada valor
						for (var j = 0; j < oListToken.length; j++) {
							oTokenVal.text = oListToken[j].getText();
							oTokenVal.key = oListToken[j].getKey();
							oJsonParam.value.push(oTokenVal);
						}

						break;
					default:
						oJsonParam.value = oControl._getInputValue();
					}

					oJsonData.push(oJsonParam);
				}
			}

			return oJsonData;
		},
		handleApplyData: function (oJsonData) {

			var sGroupName;

			for (var i = 0; i < oJsonData.length; i++) {

				sGroupName = null;

				if (oJsonData[i].group_name) {
					sGroupName = oJsonData[i].group_name;
				}

				var oControl = this.determineControlByName(oJsonData[i].name, sGroupName);
				if (oControl) {
					//oControl.setValue(oJsonData[i].value);
					var sType = oControl.getMetadata().getName();
					switch (sType) {
					case "sap.m.MultiComboBox":
						oControl.setSelectedKeys(oJsonData[i].value);
						break;
					case "sap.m.MultiInput":
						var listaToken = oJsonData[i].value;
						//repassa cada token
						for (var j = 0; j < listaToken.length; j++) {
							oControl.addToken(new sap.m.Token({
								key: listaToken[j].key,
								text: listaToken[j].text
							}));
						}

						break;
					default:
						oControl.setValue(oJsonData[i].value);
					}
				}
			}
		},
		handleGetFiltersWithValues: function () {
			var i;
			var oControl;
			var aFilters = this.getFilterGroupItems();

			var aFiltersWithValue = [];

			for (i = 0; i < aFilters.length; i++) {
				oControl = this.determineControlByFilterItem(aFilters[i]);
				//var valueC = undefined;
				var sType = oControl.getMetadata().getName();

				var temValor = false;

				switch (sType) {
				case "sap.m.MultiComboBox":
					var valueC = oControl.getSelectedKeys();

					if (valueC.length > 0) {
						temValor = true;
					}
					break;
				case "sap.m.MultiInput":
					valueC = oControl.getTokens();

					if (valueC.length > 0) {
						temValor = true;
					}
					break;
				default:
					valueC = oControl._getInputValue();

					if (valueC.length > 0) {
						temValor = true;
					}
				}
				if (oControl && temValor === true) {
					aFiltersWithValue.push(aFilters[i]);
				}
			}

			return aFiltersWithValue;
		},

		/* ************** auxiliares  ************** */
		formatDateUTCtoLocale: function (dDate) {
			if (dDate) {
				return new Date(dDate.getUTCFullYear(), dDate.getUTCMonth(), dDate.getUTCDate());
			}
			return dDate;

		},
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		viewSearchField: function (oEvent) {

			var oSearchField = this.oFilterBar.getBasicSearch();
			if (!oSearchField) {
				var oBasicSearch = new sap.m.SearchField({
					showSearchButton: false
				});
			} else {
				oSearchField = null;
			}

			this.oFilterBar.setBasicSearch(oBasicSearch);
		},
		loadVariantStub: function () {
			var oVM = this.oFilterBar._oVariantManagement;
			oVM.initialise = function () {
				this.fireEvent("initialise");
				this._setStandardVariant();

				this._setSelectedVariant();
			};

			var nKey = 0;
			var mMap = {};
			var sCurrentVariantKey = null;
			oVM._oVariantSet = {

				getVariant: function (sKey) {
					return mMap[sKey];
				},
				addVariant: function (sName) {
					var sKey = "" + nKey++;

					var oVariant = {
						key: sKey,
						name: sName,
						getItemValue: function (s) {
							return this[s];
						},
						setItemValue: function (s, oObj) {
							this[s] = oObj;
						},
						getVariantKey: function () {
							return this.key;
						}
					};
					mMap[sKey] = oVariant;

					return oVariant;
				},
				setCurrentVariantKey: function (sKey) {
					sCurrentVariantKey = sKey;
				},
				getCurrentVariantKey: function () {
					return sCurrentVariantKey;
				},
				delVariant: function (sKey) {
					if (mMap[sKey]) {
						delete mMap[sKey];
					}
				}

			};
		},
		/* ************** Padrão  ************** */
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("ListaLote").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			// Multi Input
			var oMultiInput = this.getView().byId('MI_nf');
			oMultiInput.addValidator(function (oEvent) {
				return new sap.m.Token({
					key: oEvent.text,
					text: oEvent.text
				});
			});

			this.oFilterBar = null;
			var sViewId = this.getView().getId();

			this.oFilterBar = sap.ui.getCore().byId(sViewId + "--filterBar");

			this.oFilterBar.registerFetchData(this.handleFetchData);
			this.oFilterBar.registerApplyData(this.handleApplyData);
			this.oFilterBar.registerGetFiltersWithValues(this.handleGetFiltersWithValues);

			this.loadVariantStub();

			//this.viewSearchField();

			this.oFilterBar.fireInitialise();
		},
		onExit: function () {

			/*			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
						var aControls = [{
							"controlId": "Fiori_ListReport_ListReport_0-filterBars-Fiori_ListReport_FilterBar-1-filters-Fiori_ListReport_ComboBoxFilter-1546621918763---1",
							"groups": ["items"]
						}, {
							"controlId": "Fiori_ListReport_ListReport_0-filterBars-Fiori_ListReport_FilterBar-1-filters-Fiori_ListReport_ComboBoxFilter-1545321611990---1",
							"groups": ["items"]
						}, {
							"controlId": "Fiori_ListReport_ListReport_0-content-Fiori_ListReport_Table-1",
							"groups": ["items"]
						}];
						for (var i = 0; i < aControls.length; i++) {
							var oControl = this.getView().byId(aControls[i].controlId);
							for (var j = 0; j < aControls[i].groups.length; j++) {
								var sAggregationName = aControls[i].groups[j];
								var oBindingInfo = oControl.getBindingInfo(sAggregationName);
								var oTemplate = oBindingInfo.template;
								oTemplate.destroy();
							}
						}*/

		}
	});
}, /* bExport= */ true);