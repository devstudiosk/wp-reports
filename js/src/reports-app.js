String.prototype.replaceAll = function(map) {
	var target = this;
	for (var key in map) {
		target = target.replace(new RegExp(key, 'g'), map[key]);
	}
	return target;
};

NProgress.configure({
	parent: '.report-area'
});

jQuery.noConflict();
(function($) {
	$(function() {
		$(document).ready(function() {

			DS_WP_Reports = DS_WP_Reports || {};
			DS_WP_Reports.chart = null;
			DS_WP_Reports.dateFormat = 'YYYY-MM-DD';
			DS_WP_Reports.dateRanges;
			DS_WP_Reports.lastReportItemClicked;

			DS_WP_Reports.buildLoader = function() {

				var result = '<div class="loading-indicator">';
				for (var index = 1; index < 6; index++) {
					result += '<div class="rect' + index + '"></div>';
				}
				result += '</div>';
				return result;

			};

			DS_WP_Reports.stretchCanvas = function(id) {

				var canvas = $('#' + id);
				var w = canvas.parent().innerWidth();
				canvas.attr({
					'width': (w - 20) + 'px'
				});
			};

			DS_WP_Reports.switchReport = function(element) {

				if ($(element).hasClass('disabled')) {
					return false;
				}

				var reportId = $(element).data('report-id');

				DS_WP_Reports.lastReportItemClicked = $(element);
				$(element).closest('li').append(DS_WP_Reports.buildLoader());
				NProgress.start();
				DS_WP_Reports.lastReportItemClicked.closest('ul').find('a').addClass('disabled');

				$.post(DS_WP_Reports.ajax_url, {
					'action': DS_WP_Reports.action_get_report_setup,
					'report_id': reportId
				}, DS_WP_Reports.onReportSetupLoaded)
						.fail(DS_WP_Reports.onReportSetupFailed);

				return false;

			};

			DS_WP_Reports.onReportDataLoaded = function(data, textStatus, jqXHR) {

				if (data.success === true) {

					DS_WP_Reports.initExportButton();

					var reportContent = $('.report-content');
					$('.highlights').remove();

					if (data.data.highlights) {

						var html = '<div class="row highlights">';
						var highlightCounter = 0;
						for (var highlightIndex in data.data.highlights) {

							var highlightItem = data.data.highlights[highlightIndex];
							html += '<div class="col-md-2 col-sm-4 col-xs-6 highlight-item">';
							html += '<span class="title">' + highlightItem.title + '</span>';

							var color = DS_WP_Reports.getChartColor(highlightCounter++);
							html += '<div class="value" style="color: ' + color + ';">' + highlightItem.value + '</div>';
							html += '<span class="description">' + highlightItem.description + '</span>';
							html += '</div><!-- /.highlight -->';

						}

						html += '</div><!-- /.highlights -->';
						$(html).insertBefore(reportContent.closest('.row'));

					}

					if (data.data.values.length === 0) {
						reportContent.append('<p>No data available for current selection.</p>');
					}

					if (data.data.visualization === 'timeline') {

						if (DS_WP_Reports.chart !== null) {

							DS_WP_Reports.chart.destroy();
							reportContent.find('#ds-wp-reports-chart').remove();

						}

						reportContent.append('<canvas id="ds-wp-reports-chart" width="100%" height="300"></canvas>');
						DS_WP_Reports.stretchCanvas('ds-wp-reports-chart');

						var labels = new Array();
						var labelsInitialized = false;

						var chartData = [];
						var counter = 0;
						for (var labelIndex in data.data.labels) {

							var dataset = new Array();
							for (var i in data.data.values) {

								var item = data.data.values[i];
								if (!labelsInitialized) {
									labels.push(i);
								}

								for (var valuesIndex in item) {
									if (valuesIndex === labelIndex) {
										dataset.push(item[valuesIndex]);
									}
								}

							}

							labelsInitialized = true;

							var color = DS_WP_Reports.getChartColor(counter);
							chartData.push({
								label: data.data.labels[labelIndex],
								backgroundColor: color,
								borderColor: color,
								data: dataset,
								fill: false
							});

							counter++;

						}

						var ctx = $("#ds-wp-reports-chart").get(0).getContext("2d");
						DS_WP_Reports.chart = new Chart(ctx, {
							type: 'line',
							data: {
								labels: labels,
								datasets: chartData
							},
							options: {
								responsive: true,
								tooltips: {
									mode: 'index',
									intersect: false
								},
								hover: {
									mode: 'nearest',
									intersect: true
								}
							}
						});
					} else if (data.data.visualization === 'tabular') {

						var existingTable = reportContent.find('.report-table');

						if (existingTable.length === 0) {

							var tableHtml = '<table class="table table-bordered report-table">';
							tableHtml += '<thead>';
							for (var index in data.data.labels) {
								tableHtml += '<th data-dynatable-column="' + index + '">' + data.data.labels[index] + '</th>';
							}
							tableHtml += '</thead>';
							tableHtml += '<tbody>';
							tableHtml += '</body>';
							tableHtml += '</table>';
							reportContent.append(tableHtml);

						}

						var dataset = new Array();
						var limit = data.data.values.length;
						for (var i = 0; i < limit; i++) {
							dataset.push(data.data.values[i]);
						}

						if (existingTable.length === 0) {

							$('.report-table').dynatable({
								features: {
									pushState: false,
									sort: false,
									search: false,
									perPageSelect: false
								},
								dataset: {
									records: dataset,
									perPageDefault: 50
								}
							});

						} else {

							var dynatable = existingTable.data('dynatable');
							dynatable.records.updateFromJson(dataset);
							dynatable.records.init();
							dynatable.settings.dataset.originalRecords = dataset;
							dynatable.process();
						}
					}

				}

			};

			DS_WP_Reports.getChartColor = function(index) {

				var colors = [
					'#2ecc71', '#e74c3c', '#8e44ad', '#f39c12', '#3498db', '#2c3e50'
				];

				return colors[index % colors.length];
			};

			DS_WP_Reports.toggleFilters = function() {
				$('.filters-area').toggle();
				return false;
			};

			DS_WP_Reports.onReportSetupLoaded = function(data, textStatus, jqXHR) {

				if (data.success === true) {

					var reportSetup = data.data;
					var reportArea = $('.report-area');
					reportArea.empty();

					//	top bar
					var html = '<div class="row top-bar">';
					html += '<div class="col-md-6">';
					html += '<h3 class="title">' + reportSetup.name + '</h3>';
					html += '</div>';
					html += '<div class="col-md-6">';

					html += '<div id="daterange" class="pull-right">';
					html += '<i class="glyphicon glyphicon-calendar fa fa-calendar"></i>&nbsp;';
					html += '<span></span> <b class="caret"></b>';
					html += '</div><!-- /#daterange -->';
					html += '<a href="#" class="pull-right filter-toggle export-button">';
					html += '<i class="glyphicon glyphicon-download-alt"></i>&nbsp;Export';
					html += '</a>';

					var showFiltersTrigger = reportSetup.filters && reportSetup.filters.length;
					if (showFiltersTrigger) {

						html += '<a href="#" class="pull-right filter-toggle" onclick="return DS_WP_Reports.toggleFilters();">';
						html += '<i class="glyphicon glyphicon-filter"></i>&nbsp;Filter';
						html += '</a>';

					}

					html += '</div>';
					html += '</div>';

					//	report options form
					html += '<form class="row report-options">';
					html += '<input type="hidden" name="report_id" value="' + reportSetup.report_id + '" />';

					//	visualization types
					//	@todo show selector when multiple types available
					html += '<input type="hidden" name="visualization" value="' + reportSetup.suitable_visualizations[0] + '" />';
					html += '<div class="col-xs-12 filters-area">';

					//	filters
					var filtersHtml = '';
					for (var index in reportSetup.filters) {

						var filter = reportSetup.filters[index];
						var filterLabel = filter.label;
						var filterInputId = 'filter_' + filter.filter_id;
						if (filterLabel) {
							filtersHtml += '<label for="' + filterInputId + '" style="width: 100%;">' + filterLabel;
						}
						filtersHtml += '<select class="form-control" name="' + filter.filter_id + '[]" id="' + filterInputId + '" multiple="multiple" style="width: 100%;">';
						for (var optionIndex in filter.values) {

							var option = filter.values[optionIndex];
							filtersHtml += '<option value="' + optionIndex + '">' + option + '</option>';
						}
						filtersHtml += '</select>';
						if (filterLabel) {
							filtersHtml += '</label>';
						}
					}

					html += filtersHtml;
					html += '</div>';
					html += '<input type="hidden" name="date_from" value="" />';
					html += '<input type="hidden" name="date_to" value="" />';
					html += '</form>';
					html += '<div class="row">';
					html += '<div class="col-xs12 report-content"></div>';
					html += '</div>';
					html += '</div><!-- /.row -->';
					reportArea.append(html);

					var reportForm = reportArea.find('form.report-options');
					reportForm.on('submit', DS_WP_Reports.submitReportOptionsForm);
					DS_WP_Reports.initializeDaterangePicker();
					reportForm.find('select').select2();
					reportForm.find('select').on('change', function(e) {
						reportForm.trigger('submit');
					});

					$('.report-area').find('form.report-options').trigger('submit');
				}

				DS_WP_Reports.lastReportItemClicked.closest('ul').find('li').removeClass('active');
				DS_WP_Reports.lastReportItemClicked.closest('li').addClass('active');
				DS_WP_Reports.lastReportItemClicked.closest('li').find('.loading-indicator').remove();
				DS_WP_Reports.lastReportItemClicked.closest('ul').find('a.disabled').removeClass('disabled');
				NProgress.done();

			};

			DS_WP_Reports.submitReportOptionsForm = function() {

				//	@todo indicate loading

				var form = $(this);
				var data = 'action=' + DS_WP_Reports.action_get_report_data + '&' + form.serialize();
				$.post(DS_WP_Reports.ajax_url, data, DS_WP_Reports.onReportDataLoaded)
						.fail(DS_WP_Reports.onReportDataLoadFailed);
				return false;

			};

			DS_WP_Reports.initExportButton = function() {

				var exportButton = $('.export-button');

				exportButton.click(function() {
					DS_WP_Reports.exportButtonOnClickAction(exportButton);
				});

			};

			DS_WP_Reports.exportButtonOnClickAction = function() {

				var reportArea = $('.report-area');
				var reportForm = reportArea.find('form.report-options');

				var formData = reportForm.serialize() + '&export=csv';

				var data = '?action=' + DS_WP_Reports.action_get_report_data + '&' + formData;
				window.location = DS_WP_Reports.ajax_url + data;

			};


			DS_WP_Reports.getDateRanges = function(formatForDatepicker) {

				if (typeof DS_WP_Reports.dateRanges === 'undefined') {

					DS_WP_Reports.dateRanges = {
						last_7_days: {
							label: DS_WP_Reports.last_x_days.replaceAll({
								'%%count%%': 7
							}),
							start: moment().subtract(7, 'days'),
							end: moment()
						},
						last_30_days: {
							label: DS_WP_Reports.last_x_days.replaceAll({
								'%%count%%': 30
							}),
							start: moment().subtract(30, 'days'),
							end: moment()
						},
						this_month: {
							label: DS_WP_Reports.this_month,
							start: moment().startOf('month'),
							end: moment()
						},
						last_month: {
							label: DS_WP_Reports.last_month,
							start: moment().startOf('month').subtract(1, 'days').startOf('month'),
							end: moment().startOf('month').subtract(1, 'days')
						}
					};

				}

				var dateRanges = DS_WP_Reports.dateRanges;

				if (!formatForDatepicker) {
					return dateRanges;
				}

				var result = {};
				for (var index in dateRanges) {

					var dr = dateRanges[index];
					result[dr.label] = [
						dr.start, dr.end
					];

				}

				return result;
			};

			DS_WP_Reports.getPredefinedDateRangeIdByLabel = function(label) {

				var dateRanges = DS_WP_Reports.getDateRanges();
				for (var index in dateRanges) {

					var dr = dateRanges[index];
					if (label === dr.label) {
						return index;
					}

				}

				return null;

			};

			DS_WP_Reports.getPredefinedDateRangeById = function(id) {

				var dateRanges = DS_WP_Reports.getDateRanges();
				for (var index in dateRanges) {

					if (id === index) {
						return dateRanges[index];
					}

				}

				return null;

			};

			DS_WP_Reports.initializeDaterangePicker = function() {

				//	default dates
				var startDate = moment().subtract(31, 'days');
				var endDate = moment().subtract(1, 'days');

				//	use start/end dates from cookies if available
				var cookieStartDate = Cookies.get('ds-wpr-start-date');
				if (typeof cookieStartDate !== 'undefined') {
					startDate = moment("" + cookieStartDate);
				}

				var cookieEndDate = Cookies.get('ds-wpr-end-date');
				if (typeof cookieEndDate !== 'undefined') {
					endDate = moment("" + cookieEndDate);
				}

				//	use predefined date range from cookie if available
				var cookieDateRange = Cookies.get('ds-wpr-range');
				if (typeof cookieDateRange !== 'undefined') {

					var dateRange = DS_WP_Reports.getPredefinedDateRangeById(cookieDateRange);
					if (dateRange !== null) {

						startDate = dateRange.start;
						endDate = dateRange.end;

					}

				}

				$('#daterange').daterangepicker({
					showDropdowns: true,
					showWeekNumbers: true,
					locale: {
						format: DS_WP_Reports.dateFormat
					},
					startDate: startDate,
					endDate: endDate,
					ranges: DS_WP_Reports.getDateRanges(true),
					alwaysShowCalendars: true,
					opens: 'left'
				}, function(start, end, label) {

					DS_WP_Reports.onDateRangeChanged(start, end, label);
					$('.report-area').find('form.report-options').trigger('submit');

				});

				DS_WP_Reports.onDateRangeChanged(startDate, endDate, '__init__');

			};

			DS_WP_Reports.onDateRangeChanged = function(start, end, label) {

				var startDateFormatted = start.format(DS_WP_Reports.dateFormat);
				var endDateFormatted = end.format(DS_WP_Reports.dateFormat);

				if (label !== '__init__') {

					var predefinedDateRange = DS_WP_Reports.getPredefinedDateRangeIdByLabel(label);
					if (predefinedDateRange !== null) {

						Cookies.set('ds-wpr-range', predefinedDateRange, {
							expires: 365,
							path: '/',
							domain: window.location.hostname
						});
						Cookies.remove('ds-wpr-start-date');
						Cookies.remove('ds-wpr-end-date');

					} else {

						Cookies.set('ds-wpr-start-date', startDateFormatted, {
							expires: 365,
							path: '/',
							domain: window.location.hostname
						});
						Cookies.set('ds-wpr-end-date', endDateFormatted, {
							expires: 365,
							path: '/',
							domain: window.location.hostname
						});
						Cookies.remove('ds-wpr-range');

					}

				}

				$('#daterange span').html(startDateFormatted + ' - ' + endDateFormatted);
				$('.report-area').find('form.report-options input[name=date_from]').val(startDateFormatted);
				$('.report-area').find('form.report-options input[name=date_to]').val(endDateFormatted);

			};

			DS_WP_Reports.onReportDataLoadFailed = function(jqXHR, textStatus, errorThrown) {
				//	@todo hand over to global error handler
				//	@todo hide loading indicator
			};

			DS_WP_Reports.onReportSetupFailed = function(jqXHR, textStatus, errorThrown) {
				//	@todo hand over to global error handler
				//	@todo hide loading indicator
			};

			//	do nothing and wait for user to select a report (or perhaps show
			//	default report?)


		});
	});
})(jQuery);
