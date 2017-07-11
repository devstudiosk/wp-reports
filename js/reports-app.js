jQuery.noConflict();
(function($) {
	$(function() {
		$(document).ready(function() {

			DS_WP_Reports = DS_WP_Reports || {};
			DS_WP_Reports.dateFormat = 'YYYY-MM-DD';
			DS_WP_Reports.stretchCanvas = function(id) {

				var canvas = $('#' + id);
				var w = canvas.parent().innerWidth();
				canvas.attr({
					'width': (w - 20) + 'px'
				});
			};
			DS_WP_Reports.chart = null;
			DS_WP_Reports.switchReport = function(element) {

				var reportId = $(element).data('report-id');
				//	@todo indicate loading
				$.post(DS_WP_Reports.ajax_url, {
					'action': DS_WP_Reports.action_get_report_setup,
					'report_id': reportId
				}, DS_WP_Reports.onReportSetupLoaded)
						.fail(DS_WP_Reports.onReportSetupFailed);
				$(element).closest('ul').find('li').removeClass('active');
				$(element).closest('li').addClass('active');
				return false;
			};

			DS_WP_Reports.onReportDataLoaded = function(data, textStatus, jqXHR) {

				if (data.success === true) {

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

					if (data.data.visualization === 'timeline') {

						if (DS_WP_Reports.chart !== null) {

							DS_WP_Reports.chart.destroy();
							reportContent.find('#ds-wp-reports-chart');

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

						reportContent.find('.report-table').remove();
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

						var dataset = new Array();
						var limit = data.data.values.length;
						for (var i = 0; i < limit; i++) {
							dataset.push(data.data.values[i]);
						}

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
					html += '<div class="col-xs12 report-content"></div>'
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

				//	@todo hide loading indicator

			};
			DS_WP_Reports.submitReportOptionsForm = function() {

				//	@todo indicate loading

				var form = $(this);
				var data = 'action=' + DS_WP_Reports.action_get_report_data + '&' + form.serialize();
				$.post(DS_WP_Reports.ajax_url, data, DS_WP_Reports.onReportDataLoaded)
						.fail(DS_WP_Reports.onReportDataLoadFailed);
				return false;

			};

			DS_WP_Reports.initializeDaterangePicker = function() {

				var startDate = moment().subtract(30, 'days');
				var endDate = moment();
				$('#daterange').daterangepicker({
					"showDropdowns": true,
					"showWeekNumbers": true,
					locale: {
						format: DS_WP_Reports.dateFormat
					},
					startDate: startDate,
					endDate: endDate,
					"ranges": {
						"Last 7 Days": [
							moment().subtract(7, 'days'),
							moment()
						],
						"Last 30 Days": [
							moment().subtract(30, 'days'),
							moment()
						],
						"This Month": [
							moment().startOf('month'),
							moment()
						],
						"Last Month": [
							moment().startOf('month').subtract(1, 'days').startOf('month'),
							moment().startOf('month').subtract(1, 'days')
						]
					},
					"alwaysShowCalendars": true,
					"opens": "left"
				}, function(start, end, label) {

					DS_WP_Reports.onDateRangeChanged(start, end);
					$('.report-area').find('form.report-options').trigger('submit');

				});
				DS_WP_Reports.onDateRangeChanged(startDate, endDate);
			};

			DS_WP_Reports.onDateRangeChanged = function(start, end) {

				$('#daterange span').html(start.format(DS_WP_Reports.dateFormat) + ' - ' + end.format(DS_WP_Reports.dateFormat));
				$('.report-area').find('form.report-options input[name=date_from]').val(moment(start).format(DS_WP_Reports.dateFormat));
				$('.report-area').find('form.report-options input[name=date_to]').val(moment(end).format(DS_WP_Reports.dateFormat));

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
			//	default report)

		});
	});
})(jQuery);
