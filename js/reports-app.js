jQuery.noConflict();
(function($) {
	$(function() {
		$(document).ready(function() {

			DS_WP_Reports = DS_WP_Reports || {};
			DS_WP_Reports.stretchCanvas = function(id) {

				var canvas = $('#' + id);
				var w = canvas.parent().innerWidth();
				canvas.attr({
					'width': (w - 20) + 'px'
				});
			};

			DS_WP_Reports.stretchCanvas('vsst-chart-daily-increments');
			var dailyIncrementsChart = null;

			$('input[name="daterange"]').daterangepicker({
				"showDropdowns": true,
				"showWeekNumbers": true,
				locale: {
					format: 'YYYY-MM-DD'
				},
				startDate: moment().subtract(30, 'days'),
				endDate: moment(),
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
				DS_WP_Reports.reloadData(start, end, label);
			});

			DS_WP_Reports.reloadData = function(start, end, label) {

				$.post(DS_WP_Reports.ajax_url, {
					'action': DS_WP_Reports.action_get_report_data,
					'from': start.format('YYYY-MM-DD'),
					'to': end.format('YYYY-MM-DD'),
				}, function(response) {

					if (response.success == 'true') {

						var labels = new Array();
						var dataset1 = new Array();
						var dataset2 = new Array();
						for (i in response.data) {

							var item = response.data[i];
							labels.push(i);
							dataset1.push(item.derived + item.not_derived);
							dataset2.push(item.not_derived);
						}

						var chartData = [
							{
								label: 'Total',
								fillColor: "rgba(220,220,220,0.2)",
								strokeColor: "rgba(220,220,220,1)",
								pointColor: "rgba(220,220,220,1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(220,220,220,1)",
								data: dataset1
							}, {
								label: 'With location',
								fillColor: "rgba(151,187,205,0.2)",
								strokeColor: "rgba(151,187,205,1)",
								pointColor: "rgba(151,187,205,1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(151,187,205,1)",
								data: dataset2
							}
						];

						if (dailyIncrementsChart != null) {
							dailyIncrementsChart.destroy();
						}

						var ctx = $("#vsst-chart-daily-increments").get(0).getContext("2d");
						dailyIncrementsChart = new Chart(ctx).Line({
							labels: labels,
							datasets: chartData
						});

					}
				});
			};

			DS_WP_Reports.switchReport = function(reportId) {

				//	@todo indicate loading
				$.post(DS_WP_Reports.ajax_url, {
					'action': DS_WP_Reports.action_get_report_setup,
					'report_id': reportId
				}, DS_WP_Reports.onReportSetupLoaded)
						.fail(DS_WP_Reports.onReportSetupFailed);

			};

			DS_WP_Reports.onReportSetupLoaded = function(data, textStatus, jqXHR) {

				if (data.success == 'true') {

				}

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
