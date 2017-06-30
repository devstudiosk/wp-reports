<?php

/**
 * 
 */
class SmartAdsClickReport {

	public static function init() {

		add_filter('wpr-available-reports', array(__CLASS__, 'addReport'), 10, 1);

	}

	public static function addReport($reports) {

		$reports['smart-ads-click-stats'] = array(
			'name' => __('Smart Ads - click stats per day'),
			'filters' => array(
				array(
					'filter_id' => 'data_sources',
					'values' => array(),
					'default_value' => 'all'
				)
			),
			'data_callback' => array(__CLASS__, 'handleDataRequest'),
			'suitable_visualisations' => array('tabular', 'timeline')
		);

		return $reports;

	}

	public static function isValidMySQLDate($value) {

		$matches = preg_match('/^\d{4}\-\d{2}\-\d{2}$/', $value);
		return ($matches === 1);

	}

	public static function handleDataRequest($reportId = '', $settings = array()) {

		$currentTime = current_time('timestamp');
		$toDate = array_key_exists('to', $settings) ? trim($settings['to']) : date('Y-m-d', $currentTime);
		$fromDate = array_key_exists('from', $settings) ? trim($settings['from']) : date('Y-m-d', $currentTime - 30 * 86400);

		if (!self::isValidMySQLDate($toDate) || !self::isValidMySQLDate($fromDate)) {
			return new WP_Error(__('Invalid date range'));
		}

		$dailyTotalsData = AndroidKatalogAffiliateModel::getDailyClickStats($fromDate, $toDate, $dataSources);

		$interpolatedData = array();
		$loopTime = strtotime($fromDate);
		$endTime = strtotime($toDate);
		do {

			$loopTimeFormatted = date('Y-m-d', $loopTime);
			$value = 0;

			foreach ($dailyTotalsData as $entry) {
				if ($entry->date == $loopTimeFormatted) {
					$value = $entry->total;
				}
			}
			$interpolatedData[$loopTimeFormatted] = array(
				'total' => intval($value)
			);
			$loopTime += 86400;
		} while ($loopTime <= $endTime);

	}

}
